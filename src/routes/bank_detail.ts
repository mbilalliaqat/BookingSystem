import app from '../app';
import { 
  createBankDetail, 
  updateBankDetail, 
  deleteBankDetail 
} from '../services/bank_detail';

app.post('/bank-details', async (c) => {
  try {
    const body = await c.req.json();

    const result = await createBankDetail(body, globalThis.env.DB);

    return c.json(
      {
        status: result.status,
        message: result.message,
        ...(result.data && { data: result.data }), 
        ...(result.errors && { errors: result.errors }),
      },
      result.code
    );
  } catch (error) {
    console.error('Error creating bank detail record:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to create bank detail record',
      },
      500
    );
  }
});

app.get('/bank-details', async (c) => {
  try {
    // Access the database from global environment
    const db = globalThis.env.DB;

    // Fetch all bank detail entries
    const bankDetails = await db
      .selectFrom('bank_details')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();

    return c.json(
      {
        status: 'success',
        bankDetails: bankDetails
      },
      200
    );
  } catch (error) {
    console.error('Error fetching bank details:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to fetch bank details',
        details: error.message
      },
      500
    );
  }
});

app.put('/bank-details/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const body = await c.req.json();

    // Call the updateBankDetail service
    const result = await updateBankDetail(id, body, globalThis.env.DB);

    // Return the result from the service
    return c.json(
      {
        status: result.status,
        message: result.message,
        ...(result.data && { data: result.data }),
        ...(result.errors && { errors: result.errors }),
      },
      result.code
    );
  } catch (error) {
    console.error('Error updating bank detail record:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to update bank detail record',
      },
      500
    );
  }
});

app.delete('/bank-details/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const deletedBy = c.req.header('X-User-Name') || 'system';

    // Call the deleteBankDetail service
    const result = await deleteBankDetail(id, globalThis.env.DB, deletedBy);

    // Return the result from the service
    return c.json(
      {
        status: result.status,
        message: result.message,
        ...(result.data && { data: result.data }),
      },
      result.code
    );
  } catch (error) {
    console.error('Error deleting bank detail record:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to delete bank detail record',
      },
      500
    );
  }
});