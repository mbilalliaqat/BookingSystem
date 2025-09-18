// Add these routes to your users.ts file or create a new umrahPayments.ts file

import app from '../app';
import { createUmrahPayment, getUmrahPaymentsByUmrahId } from '../services/umrahPayment/index'; // or wherever you place the functions

// Route to create payment for a specific umrah booking
app.post('/umrah/:id/payments', async (c) => {
  try {
    const umrahId = parseInt(c.req.param('id'));
    if (isNaN(umrahId)) {
      return c.json({ status: 'error', code: 400, message: 'Invalid Umrah ID' }, 400);
    }
    
    const body = await c.req.json();
    
    // Add the umrah_id from the URL parameter to the body for the service function
    const payload = { ...body, umrah_id: umrahId };
    
    const result = await createUmrahPayment(payload, globalThis.env.DB);
    
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
    console.error('Error creating Umrah payment:', error);
    return c.json(
      {
        status: 'error',
        message: 'Failed to create Umrah payment'
      },
      500
    );
  }
});

// Route to get payment history for a specific umrah booking
app.get('/umrah/:id/payments', async (c) => {
  try {
    const umrahId = parseInt(c.req.param('id'));
    if (isNaN(umrahId)) {
      return c.json({ status: 'error', code: 400, message: 'Invalid Umrah ID' }, 400);
    }
    
    const result = await getUmrahPaymentsByUmrahId(umrahId, globalThis.env.DB);
    
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
    console.error('Error fetching Umrah payment history:', error);
    return c.json(
      {
        status: 'error',
        message: 'Failed to fetch Umrah payment history'
      },
      500
    );
  }
});

// Standalone routes (similar to your ticket_payments routes)
// POST route for creating umrah payments
app.post('/umrah_payments', async (c) => {
  try {
    const body = await c.req.json();

    // Call the create umrah payment service
    const result = await createUmrahPayment(body, globalThis.env.DB);

    // Return the result from the service
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
    console.error('Error creating Umrah payment:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to create Umrah payment',
      },
      500
    );
  }
});

// GET route for fetching umrah payments by umrah ID
app.get('/umrah_payments/:umrahId', async (c) => {
  try {
    const umrahId = Number(c.req.param('umrahId'));

    if (isNaN(umrahId)) {
      return c.json(
        {
          status: 'error',
          message: 'Invalid Umrah ID',
        },
        400
      );
    }

    // Call the get umrah payments service
    const result = await getUmrahPaymentsByUmrahId(umrahId, globalThis.env.DB);

    // Return the result from the service
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
    console.error('Error fetching Umrah payments:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to fetch Umrah payments',
      },
      500
    );
  }
});