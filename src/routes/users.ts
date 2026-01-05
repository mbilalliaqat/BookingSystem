import app from '../app';
import { loginUser, signupUser, getPendingUsers } from '../services/users';
import { checkLogin, adminOnly } from '../middlewares';
import { incrementEntryCounts, getEntryCounts } from '../services/counters';
import { createUmrahPayment, getUmrahPaymentsByUmrahId, updateUmrahPayment, deleteUmrahPayment } from '../services/umrahPayment';
import { deleteUmrah } from '../services/umrah';
import { encrypt } from '../utils/encryption';




// User signup endpoint
app.post('/user/signup', async (c) => {
  try {
    const body = await c.req.json();

    // Call the signup service
    const result = await signupUser(body, globalThis.env.DB);

    // Return the result from the service
    return c.json(
      {
        status: result.status,
        message: result.message,
        ...(result.user && { user: result.user }),
        ...(result.errors && { errors: result.errors }),
      },
      result.code
    );
  } catch (error) {
    console.error('Error during signup:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to create user',
      },
      500
    );
  }
});

// User login endpoint
app.post('/user/login', async (c) => {
  try {
    const body = await c.req.json();
    console.log('Request body:', body);

    // Call the login service
    const result = await loginUser(body, globalThis.env.DB);

    // Return the result from the service
    return c.json(
      {
        status: result.status,
        message: result.message,
        ...(result.token && { token: result.token }),
        ...(result.role && { role: result.role }),
        ...(result.errors && { errors: result.errors }),
      },
      result.code
    );
  } catch (error) {
    console.error('Error during login:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to login user',
      },
      500
    );
  }
});

app.get('/admin/pending-users', checkLogin, adminOnly, async (c) => {
  try {
    // Get pending users
    const result = await getPendingUsers(globalThis.env.DB);

    // Return the result
    return c.json(
      {
        status: result.status,
        message: result.message,
        users: result.users,
      },
      result.code
    );
  } catch (error) {
    console.error('Error fetching pending users:', error);
    return c.json(
      {
        status: 'error',
        message: 'Failed to fetch pending users',
      },
      500
    );
  }
});
app.put('/admin/update-password', checkLogin, adminOnly, async (c) => {
  try {
    const body = await c.req.json();
    const { userId, newPassword } = body;

    // Validate input
    if (!userId || !newPassword) {
      return c.json(
        {
          status: 'error',
          message: 'User ID and new password are required',
        },
        400
      );
    }

    if (newPassword.length < 6) {
      return c.json(
        {
          status: 'error',
          message: 'Password must be at least 6 characters long',
        },
        400
      );
    }

    let db = globalThis.env.DB;

    // Hash the new password
    const hashedPassword = await encrypt(newPassword);

    // Update the user's password
    const updatedUser = await db
      .updateTable('users')
      .set({ 
        password_hash: hashedPassword,
        updated_at: new Date()
      })
      .where('id', '=', userId)
      .returningAll()
      .executeTakeFirst();

    if (!updatedUser) {
      return c.json(
        { 
          status: 'error', 
          message: 'User not found' 
        }, 
        404
      );
    }

    return c.json(
      {
        status: 'success',
        message: 'Password updated successfully',
        user: { 
          id: updatedUser.id, 
          username: updatedUser.username, 
          email: updatedUser.email 
        }
      }, 
      200
    );
  } catch (error) {
    console.error('Error updating password:', error);
    return c.json(
      { 
        status: 'error', 
        message: 'Failed to update password',
        details: error.message 
      }, 
      500
    );
  }
});

// Get all approved employees endpoint
app.get('/admin/employees', checkLogin, adminOnly, async (c) => {
  try {
    let db = globalThis.env.DB;

    // Fetch all approved users with role 'employee', including password_hash
    const employees = await db
      .selectFrom('users')
      .where('isApproved', '=', true)
      .where('role', '=', 'employee')
      .select(['id', 'username', 'email', 'role', 'password_hash'])
      .execute();

    return c.json(
      {
        status: 'success',
        message: 'Employees retrieved successfully',
        users: employees
      },
      200
    );
  } catch (error) {
    console.error('Error fetching employees:', error);
    return c.json(
      {
        status: 'error',
        message: 'Failed to fetch employees',
        details: error.message
      },
      500
    );
  }
});

// Add this NEW endpoint for updating password
app.put('/admin/update-password', checkLogin, adminOnly, async (c) => {
  try {
    const body = await c.req.json();
    const { userId, newPassword } = body;

    // Validate input
    if (!userId || !newPassword) {
      return c.json(
        {
          status: 'error',
          message: 'User ID and new password are required',
        },
        400
      );
    }

    if (newPassword.length < 6) {
      return c.json(
        {
          status: 'error',
          message: 'Password must be at least 6 characters long',
        },
        400
      );
    }

    let db = globalThis.env.DB;

    // Hash the new password
    const hashedPassword = await encrypt(newPassword);

    // Update the user's password
    const updatedUser = await db
      .updateTable('users')
      .set({ 
        password_hash: hashedPassword,
        updated_at: new Date()
      })
      .where('id', '=', userId)
      .returningAll()
      .executeTakeFirst();

    if (!updatedUser) {
      return c.json(
        { 
          status: 'error', 
          message: 'User not found' 
        }, 
        404
      );
    }

    return c.json(
      {
        status: 'success',
        message: 'Password updated successfully',
        user: { 
          id: updatedUser.id, 
          username: updatedUser.username, 
          email: updatedUser.email 
        }
      }, 
      200
    );
  } catch (error) {
    console.error('Error updating password:', error);
    return c.json(
      { 
        status: 'error', 
        message: 'Failed to update password',
        details: error.message 
      }, 
      500
    );
  }
});

app.post('/admin/approve-user', checkLogin, adminOnly, async (c) => {
  try {
    const body = await c.req.json();
    const { userId, approved } = body;

    // Validate input
    if (userId === undefined || approved === undefined) {
      return c.json(
        {
          status: 'error',
          message: 'User ID and approval status are required',
        },
        400
      );
    }

    let db = globalThis.env.DB;

    const updatedUser = await db
      .updateTable('users')
      .set({ isApproved: approved })
      .where('id', '=', userId)
      .returningAll()
      .executeTakeFirst();

    if (!updatedUser) {
      return c.json({ status: 'error', message: 'User not found' }, 404);
    }

    return c.json({
      status: 'success',
      message: `User ${approved ? 'approved' : 'rejected'} successfully`,
      user: { id: updatedUser.id, username: updatedUser.username, email: updatedUser.email, isApproved: updatedUser.isApproved }
    }, 200);
  } catch (error) {
    console.error('Error approving user:', error);
    return c.json({ status: 'error', message: 'Failed to process user approval' }, 500);
  }
});

app.get('/test-route', async (c) => {
  try {
    // const body = await c.req.json();

    let db = globalThis.env.DB;

    // Call the signup service
    const user = await db
      .selectFrom('User')
      // .where('username', '=', username)
      .selectAll()
      .executeTakeFirst();
    // Return the result from the service
    return c.json(
      {
        status: user,
        message: 'message success'
      },

    );
  } catch (error) {
    console.error('Error during signup:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to create user',
      },
      500
    );
  }
});

app.post('/create-user', async (c) => {
  try {
    const body = await c.req.json();

    let db = globalThis.env.DB;

    const newUser = await db
      .insertInto('users')
      .values({
        username: body.username,
        email: body.email,
         password_hash: body.password_hash, // Note: Hash this in production!
        role: body.role || 'employee',
        isApproved: body.role === 'admin' ? true : false  // Auto-approve admins
      })
      .returningAll()
      .executeTakeFirst();

    return c.json(
      {
        status: 'success',
        message: 'User created successfully',
        user: newUser
      },
      201
    );
  } catch (error) {
    console.error('Error creating user:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to create user',
        details: error.message
      },
      500
    );
  }
});

app.post('/test', async (c) => {
  try {
    const body = await c.req.json();
    let db = globalThis.env.DB;

    // Insert the data into the User table
    const result = await db
      .insertInto('User')
      .values({
        id: body.id,
        name: body.name,
        email: body.email,
        password: body.password,
        role: body.role
      })
      .execute();

    // Return the result from the service
    return c.json(
      {
        status: 'success',
        message: 'User inserted successfully',
        result: result,
      },
      200
    );
  } catch (error) {
    console.error('Error during user insertion:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to insert user',
        error: error.message // Add detailed error message
      },
      500
    );
  }
});



app.post('/umrah', async (c) => {
  try {
    const body = await c.req.json();
    const now = new Date();
    const [currentEntryNumber] = body.entry.split('/').map(Number); // Extract current entry number
    let db = globalThis.env.DB;

    const newUmrah = await db
      .insertInto('Umrah')
      .values({
        userName: body.userName,
        entry: body.entry,
        customerAdd: body.customerAdd,
        reference: body.reference,
        packageDetail: body.packageDetail || null,
        depart_date: new Date(body.depart_date),
        return_date: new Date(body.return_date),
        status: body.status || 'Processing',
        sector: body.sector,
        airline: body.airline,
        adults: body.adults,
        children: body.children,
        infants: body.infants,
        passportDetail: body.passportDetail,
        receivableAmount: body.receivableAmount,
        paidCash: body.paidCash,
        bank_title: body.bank_title,
        paidInBank: body.paidInBank,
        payableToVendor: body.payableToVendor,
        vendorName: body.vendorName,
        vendor_detail: body.vendor_detail || null,
        agent_name: body.agent_name,
        profit: body.profit,
        remainingAmount: body.remainingAmount,
        booking_date: body.booking_date,
        initial_paid_cash: body.paidCash || 0,
        initial_paid_in_bank: body.paidInBank || 0,
        initial_remaining_amount: body.receivable_amount - (body.paid_cash || 0) - (body.paid_in_bank || 0),

        createdAt: now,
        updatedAt: now
      })
      .returningAll()
      .executeTakeFirst();

    if (newUmrah) {
      await incrementEntryCounts('umrah', currentEntryNumber, db); // Pass actualEntryNumber
    }

    return c.json(
      {
        status: 'success',
        message: 'Umrah Booking created successfully',
        umrah: newUmrah
      },
      201
    );
  } catch (error) {
    console.error('Error creating umrah:', error);
    return c.json(
      {
        status: 'error',
        message: 'Failed to create umrah',
        details: error.message
      },
      500
    );
  }
});

app.get('/umrah', async (c) => {
  try {
    // Access database from global environment
    let db = globalThis.env.DB;

    // Fetch all Umrah bookings
    const umrahBookings = await db
      .selectFrom('Umrah')
      .selectAll()
      .execute();

    return c.json(
      {
        status: 'success',
        umrahBookings: umrahBookings
      },
      200
    );
  } catch (error) {
    console.error('Error fetching umrah bookings:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to fetch umrah bookings',
        details: error.message
      },
      500
    );
  }
});

app.put('/umrah/:id', async (c) => {
  try {
    const body = await c.req.json();
    const id = Number(c.req.param('id'));
    const now = new Date();

    let db = globalThis.env.DB;

    // Get current umrah data to preserve initial values
    const currentUmrah = await db
      .selectFrom('Umrah')
      .select(['initial_paid_cash', 'initial_paid_in_bank'])
      .where('id', '=', id)
      .executeTakeFirst();

    const updatedUmrah = await db
      .updateTable('Umrah')
      .set({
        userName: body.userName,
        entry: body.entry,
        customerAdd: body.customerAdd,
        reference: body.reference,
        agent_name: body.agent_name,
        packageDetail: body.packageDetail || null,
        depart_date: new Date(body.depart_date),
        return_date: new Date(body.return_date),
        status: body.status || 'Processing',
        sector: body.sector,
        airline: body.airline,
        adults: body.adults,
        children: body.children,
        infants: body.infants,
        passportDetail: body.passportDetail,
        receivableAmount: body.receivableAmount,
        paidCash: body.paidCash || 0,
        bank_title: body.bank_title,
        paidInBank: body.paidInBank || 0,
        payableToVendor: body.payableToVendor,
        vendorName: body.vendorName,
        vendor_detail: body.vendor_detail || null,
        profit: body.profit || 0,
        remainingAmount: body.remainingAmount || 0,
        booking_date: body.booking_date,
        // Preserve initial values or set them if they don't exist
        initial_paid_cash: currentUmrah?.initial_paid_cash || body.paidCash || 0,
        initial_paid_in_bank: currentUmrah?.initial_paid_in_bank || body.paidInBank || 0,
        initial_remaining_amount: currentUmrah?.initial_remaining_amount || (body.receivable_amount - (body.paid_cash || 0) - (body.paid_in_bank || 0)),

        updatedAt: now
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!updatedUmrah) {
      return c.json(
        {
          status: 'error',
          message: 'Umrah booking not found'
        },
        404
      );
    }

    return c.json(
      {
        status: 'success',
        message: 'Umrah Booking updated successfully',
        umrah: updatedUmrah
      },
      200
    );
  } catch (error) {
    console.error('Error updating umrah:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to update umrah',
        details: error.message
      },
      500
    );
  }
});

app.delete('/umrah/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const deletedBy = c.req.header('X-User-Name') || 'system';

    const result = await deleteUmrah(id, globalThis.env.DB, deletedBy);

    return c.json(
      {
        status: result.status,
        message: result.message,
        ...(result.umrah && { umrah: result.umrah }),
        ...(result.errors && { errors: result.errors }),
      },
      result.code
    );
  } catch (error) {
    console.error('Error deleting umrah:', error);
    return c.json(
      {
        status: 'error',
        message: 'Failed to delete umrah',
      },
      500
    );
  }
});

// Umrah payment routes
app.post('/umrah/payment', async (c) => {
  try {
    const body = await c.req.json();
    const result = await createUmrahPayment(body, globalThis.env.DB);
    return c.json(
      {
        status: result.status,
        message: result.message,
        ...(result.payment && { payment: result.payment }),
        ...(result.umrah && { umrah: result.umrah }),
        ...(result.errors && { errors: result.errors }),
      },
      result.code
    );
  } catch (error) {
    console.error('Error creating umrah payment:', error);
    return c.json({ status: 'error', message: 'Failed to create umrah payment' }, 500);
  }
});

app.get('/umrah/:id/payments', async (c) => {
  try {
    const umrahId = Number(c.req.param('id'));
    const result = await getUmrahPaymentsByUmrahId(umrahId, globalThis.env.DB);
    return c.json(
      {
        status: result.status,
        message: result.message,
        payments: result.payments,
      },
      result.code
    );
  } catch (error) {
    console.error('Error fetching umrah payments:', error);
    return c.json({ status: 'error', message: 'Failed to fetch umrah payments' }, 500);
  }
});

app.put('/umrah/payment/:id', async (c) => {
  try {
    const paymentId = Number(c.req.param('id'));
    const body = await c.req.json();
    const result = await updateUmrahPayment(paymentId, body, globalThis.env.DB);
    return c.json(
      {
        status: result.status,
        message: result.message,
        ...(result.payment && { payment: result.payment }),
        ...(result.errors && { errors: result.errors }),
      },
      result.code
    );
  } catch (error) {
    console.error('Error updating umrah payment:', error);
    return c.json({ status: 'error', message: 'Failed to update umrah payment' }, 500);
  }
});

app.delete('/umrah/payment/:id', async (c) => {
  try {
    const paymentId = Number(c.req.param('id'));
    const result = await deleteUmrahPayment(paymentId, globalThis.env.DB);
    return c.json(
      {
        status: result.status,
        message: result.message,
        ...(result.payment && { payment: result.payment }),
        ...(result.errors && { errors: result.errors }),
      },
      result.code
    );
  } catch (error) {
    console.error('Error deleting umrah payment:', error);
    return c.json({ status: 'error', message: 'Failed to delete umrah payment' }, 500);
  }
});