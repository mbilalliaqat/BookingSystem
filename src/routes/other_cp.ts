import app from '../app';
import { 
  createOtherCp, 
  getAllOtherCp, 
  getOtherCpById, 
  updateOtherCp, 
  deleteOtherCp 
} from '../services/Other_Cp';

// Create a new Other CP entry
app.post('/other-cp', async (c) => {
  try {
    const body = await c.req.json();

    // Validate required fields
    if (!body.date || !body.entry || !body.employee || !body.detail || !body.card_payment || body.card_amount === undefined) {
      return c.json(
        {
          status: 'error',
          message: 'Missing required fields: date, entry, employee, detail, card_payment, and card_amount are required',
        },
        400
      );
    }

    const result = await createOtherCp(body, globalThis.env.DB);

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
    console.error('Error creating Other CP entry:', error);
    return c.json(
      {
        status: 'error',
        message: 'Failed to create Other CP entry',
      },
      500
    );
  }
});

// Get all Other CP entries
app.get('/other-cp', async (c) => {
  try {
    const result = await getAllOtherCp(globalThis.env.DB);

    return c.json(
      {
        status: result.status,
        message: result.message,
        ...(result.otherCpEntries && { otherCpEntries: result.otherCpEntries }),
        ...(result.errors && { errors: result.errors }),
      },
      result.code
    );
  } catch (error) {
    console.error('Error fetching Other CP entries:', error);
    return c.json(
      {
        status: 'error',
        message: 'Failed to fetch Other CP entries',
      },
      500
    );
  }
});

// Get a single Other CP entry by ID
app.get('/other-cp/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));

    if (isNaN(id)) {
      return c.json(
        {
          status: 'error',
          message: 'Invalid Other CP entry ID',
        },
        400
      );
    }

    const result = await getOtherCpById(id, globalThis.env.DB);

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
    console.error('Error fetching Other CP entry:', error);
    return c.json(
      {
        status: 'error',
        message: 'Failed to fetch Other CP entry',
      },
      500
    );
  }
});

// Update an Other CP entry
app.put('/other-cp/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));

    if (isNaN(id)) {
      return c.json(
        {
          status: 'error',
          message: 'Invalid Other CP entry ID',
        },
        400
      );
    }

    const body = await c.req.json();

    // Validate required fields
    if (!body.date || !body.entry || !body.employee || !body.detail || !body.card_payment || body.card_amount === undefined) {
      return c.json(
        {
          status: 'error',
          message: 'Missing required fields: date, entry, employee, detail, card_payment, and card_amount are required',
        },
        400
      );
    }

    const result = await updateOtherCp(id, body, globalThis.env.DB);

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
    console.error('Error updating Other CP entry:', error);
    return c.json(
      {
        status: 'error',
        message: 'Failed to update Other CP entry',
      },
      500
    );
  }
});

// Delete (archive) an Other CP entry
app.delete('/other-cp/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));

    if (isNaN(id)) {
      return c.json(
        {
          status: 'error',
          message: 'Invalid Other CP entry ID',
        },
        400
      );
    }

    // Get deletedBy from query params or default to 'system'
    const deletedBy = c.req.query('deletedBy') || 'system';

    const result = await deleteOtherCp(id, globalThis.env.DB, deletedBy);

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
    console.error('Error deleting Other CP entry:', error);
    return c.json(
      {
        status: 'error',
        message: 'Failed to delete Other CP entry',
      },
      500
    );
  }
});