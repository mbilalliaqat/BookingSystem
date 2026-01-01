import app from '../app';
import { 
  createNavtcc, 
  updateNavtcc, 
  deleteNavtcc,
  createNavtccPayment,
  getNavtccPaymentsByNavtccId,
  updateNavtccPayment,
  deleteNavtccPayment
} from '../services/navtcc';

// Create NAVTCC
app.post('/navtcc', async (c) => {
  try {
    const body = await c.req.json();
    const result = await createNavtcc(body, globalThis.env.DB);

    return c.json(
      {
        status: result.status,
        message: result.message,
        ...(result.data && { navtcc: result.data }),
        ...(result.errors && { errors: result.errors }),
      },
      result.code
    );
  } catch (error) {
    console.error('Error creating navtcc:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to create navtcc',
      },
      500
    );
  }
});

// Get all NAVTCC
app.get('/navtcc', async (c) => {
  try {
    const db = globalThis.env.DB;
    const navtcc = await db
      .selectFrom('navtcc')
      .selectAll()
      .execute();

    return c.json(
      {
        status: 'success',
        navtcc: navtcc
      },
      200
    );
  } catch (error) {
    console.error('Error fetching Navtcc:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to fetch Navtcc',
        details: error.message
      },
      500
    );
  }
});

// Update NAVTCC
app.put('/navtcc/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const body = await c.req.json();

    const result = await updateNavtcc(id, body, globalThis.env.DB);
    
    return c.json(
      {
        status: result.status,
        message: result.message,
        ...(result.data && { navtcc: result.data }),
        ...(result.errors && { errors: result.errors }),
      },
      result.code
    );
  } catch (error) {
    console.error("Error updating navtcc:", error);
    
    return c.json(
      {
        status: 'error',
        message: 'Failed to update navtcc',
      },
      500
    );
  }
});

// Delete NAVTCC
app.delete('/navtcc/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const deletedBy = c.req.header('X-User-Name') || 'system';

    const result = await deleteNavtcc(id, globalThis.env.DB, deletedBy);

    return c.json(
      {
        status: result.status,
        message: result.message,
        ...(result.data && { navtcc: result.data }),
        ...(result.errors && { errors: result.errors }),
      },
      result.code
    );
  } catch (error) {
    console.error('Error deleting navtcc:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to delete navtcc',
      },
      500
    );
  }
});

// ==================== PAYMENT ROUTES ====================

// Create payment for NAVTCC
app.post('/navtcc/payments', async (c) => {
  try {
    const body = await c.req.json();
    const result = await createNavtccPayment(body, globalThis.env.DB);

    return c.json(
      {
        status: result.status,
        message: result.message,
        ...(result.payment && { payment: result.payment }),
        ...(result.navtcc && { navtcc: result.navtcc }),
        ...(result.errors && { errors: result.errors }),
      },
      result.code
    );
  } catch (error) {
    console.error('Error creating NAVTCC payment:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to create NAVTCC payment',
      },
      500
    );
  }
});

// Get payment history for a specific NAVTCC
app.get('/navtcc/:id/payments', async (c) => {
  try {
    const navtccId = Number(c.req.param('id'));
    const result = await getNavtccPaymentsByNavtccId(navtccId, globalThis.env.DB);

    return c.json(
      {
        status: result.status,
        message: result.message,
        ...(result.payments && { payments: result.payments }),
        ...(result.errors && { errors: result.errors }),
      },
      result.code
    );
  } catch (error) {
    console.error('Error fetching NAVTCC payments:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to fetch NAVTCC payments',
      },
      500
    );
  }
});

// Update a payment
app.put('/navtcc/payments/:paymentId', async (c) => {
  try {
    const paymentId = Number(c.req.param('paymentId'));
    const body = await c.req.json();
    const result = await updateNavtccPayment(paymentId, body, globalThis.env.DB);

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
    console.error('Error updating NAVTCC payment:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to update NAVTCC payment',
      },
      500
    );
  }
});

// Delete a payment
app.delete('/navtcc/payments/:paymentId', async (c) => {
  try {
    const paymentId = Number(c.req.param('paymentId'));
    const result = await deleteNavtccPayment(paymentId, globalThis.env.DB);

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
    console.error('Error deleting NAVTCC payment:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to delete NAVTCC payment',
      },
      500
    );
  }
});