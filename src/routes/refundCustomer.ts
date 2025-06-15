import app from '../app';
import { createRefundCustomer, updateRefundCustomer, deleteRefundCustomer } from '../services/refundCustomer';

app.post('/refund-customer', async (c) => {
    try {
      const body = await c.req.json();
  
      // Call the create refund customer service
      const result = await createRefundCustomer(body, globalThis.env.DB);
  
      // Return the result from the service
      return c.json(
        {
          status: result.status,
          message: result.message,
          ...(result.refundCustomer && { refundCustomer: result.refundCustomer }),
          ...(result.errors && { errors: result.errors }),
        },
        result.code
      );
    } catch (error) {
      console.error('Error creating refund customer:', error);
  
      return c.json(
        {
          status: 'error',
          message: 'Failed to create refund customer',
        },
        500
      );
    }
});

app.get('/refund-customer', async (c) => {
    try {
      // Access the database from global environment
      const db = globalThis.env.DB;
  
      const refundCustomers = await db
        .selectFrom('refund_customer')
        .selectAll()
        .execute();
  
      return c.json(
        {
          status: 'success',
          refundCustomers: refundCustomers
        },
        200
      );
    } catch (error) {
      console.error('Error fetching refund customers:', error);
  
      return c.json(
        {
          status: 'error',
          message: 'Failed to fetch refund customers',
          details: error.message
        },
        500
      );
    }
});

app.put('/refund-customer/:id', async (c) => {
    try {
      const id = Number(c.req.param('id'));
      const body = await c.req.json();

      const result = await updateRefundCustomer(id, body, globalThis.env.DB);
      
      return c.json(
        {
          status: result.status,
          message: result.message,
          ...(result.refundCustomer && { refundCustomer: result.refundCustomer }),
          ...(result.errors && { errors: result.errors }),
        },
        result.code
      );
    } catch (error) {
      console.error("Error updating refund customer:", error);
      
      return c.json(
        {
          status: 'error',
          message: 'Failed to update refund customer',
        },
        500
      );
    }
});

app.delete('/refund-customer/:id', async (c) => {
    try {
      const id = Number(c.req.param('id'));
  
      // Call the delete refund customer service
      const result = await deleteRefundCustomer(id, globalThis.env.DB);
  
      // Return the result from the service
      return c.json(
        {
          status: result.status,
          message: result.message,
          ...(result.refundCustomer && { refundCustomer: result.refundCustomer }),
          ...(result.errors && { errors: result.errors }),
        },
        result.code
      );
    } catch (error) {
      console.error('Error deleting refund customer:', error);
  
      return c.json(
        {
          status: 'error',
          message: 'Failed to delete refund customer',
        },
        500
      );
    }
});