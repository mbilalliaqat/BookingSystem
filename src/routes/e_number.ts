import app from '../app';
import { 
  createENumber, 
  updateENumber, 
  deleteENumber 
} from '../services/e_number';

app.post('/e-numbers', async (c) => {
  try {
    const body = await c.req.json();

    const result = await createENumber(body, globalThis.env.DB);

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
    console.error('Error creating E-Number record:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to create E-Number record',
      },
      500
    );
  }
});

app.get('/e-numbers', async (c) => {
  try {
    // Access the database from global environment
    const db = globalThis.env.DB;

    // Fetch all E-Number entries
    const eNumbers = await db
      .selectFrom('e_numbers')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();

    return c.json(
      {
        status: 'success',
        eNumbers: eNumbers
      },
      200
    );
  } catch (error) {
    console.error('Error fetching E-Numbers:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to fetch E-Numbers',
        details: error.message
      },
      500
    );
  }
});

app.put('/e-numbers/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const body = await c.req.json();

    // Call the updateENumber service
    const result = await updateENumber(id, body, globalThis.env.DB);

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
    console.error('Error updating E-Number record:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to update E-Number record',
      },
      500
    );
  }
});

app.delete('/e-numbers/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const deletedBy = c.req.header('X-User-Name') || 'system';

    // Call the deleteENumber service
    const result = await deleteENumber(id, globalThis.env.DB, deletedBy);

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
    console.error('Error deleting E-Number record:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to delete E-Number record',
      },
      500
    );
  }
});