import app from '../app';
import { 
  createCustomer, 
  getAllCustomers, 
  getCustomerById 
} from '../services/Customers/index';

// POST /customers - Create a new customer
app.post('/customers', async (c) => {
  try {
    const body = await c.req.json();

    // Basic validation
    if (!body.name || !body.mobile_number) {
      return c.json(
        {
          status: 'error',
          message: 'Name and mobile number are required fields',
        },
        400
      );
    }

    const result = await createCustomer(body, globalThis.env.DB);

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
    console.error('Error creating customer record:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to create customer record',
      },
      500
    );
  }
});

// GET /customers - Get all customers
app.get('/customers', async (c) => {
  try {
    const result = await getAllCustomers(globalThis.env.DB);

    return c.json(
      {
        status: result.status,
        message: result.message,
        customers: result.data
      },
      result.code
    );
  } catch (error) {
    console.error('Error fetching customers:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to fetch customers',
        details: error.message
      },
      500
    );
  }
});

// GET /customers/:id - Get a specific customer by ID
app.get('/customers/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json(
        {
          status: 'error',
          message: 'Invalid customer ID',
        },
        400
      );
    }

    const result = await getCustomerById(id, globalThis.env.DB);

    return c.json(
      {
        status: result.status,
        message: result.message,
        ...(result.data && { data: result.data }),
      },
      result.code
    );
  } catch (error) {
    console.error('Error fetching customer:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to fetch customer',
      },
      500
    );
  }
});

// PUT /customers/:id - Update a customer
app.put('/customers/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const body = await c.req.json();

    if (isNaN(id)) {
      return c.json(
        {
          status: 'error',
          message: 'Invalid customer ID',
        },
        400
      );
    }

    // Call the updateCustomer service
    const result = await updateCustomer(id, body, globalThis.env.DB);

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
    console.error('Error updating customer record:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to update customer record',
      },
      500
    );
  }
});

// DELETE /customers/:id - Delete a customer
app.delete('/customers/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));

    if (isNaN(id)) {
      return c.json(
        {
          status: 'error',
          message: 'Invalid customer ID',
        },
        400
      );
    }

    // Call the deleteCustomer service
    const result = await deleteCustomer(id, globalThis.env.DB);

    // Return the result from the service
    return c.json(
      {
        status: result.status,
        message: result.message,
      },
      result.code
    );
  } catch (error) {
    console.error('Error deleting customer record:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to delete customer record',
      },
      500
    );
  }
});