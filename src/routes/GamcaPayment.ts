import app from '../app';
import {  createGamcaTokenPayment, getGamcaTokenPaymentsByTokenId, updateGamcaTokenPayment, deleteGamcaTokenPayment } from '../services/gamcaToken';

// Route to create payment for a specific GAMCA token record
app.post('/gamca-token/:id/payments', async (c) => {
  try {
    const gamcaTokenId = parseInt(c.req.param('id'));
    if (isNaN(gamcaTokenId)) {
      return c.json({ status: 'error', code: 400, message: 'Invalid GAMCA Token ID' }, 400);
    }
    
    const body = await c.req.json();
    
    // Add the gamca_token_id from the URL parameter to the body for the service function
    const payload = { ...body, gamca_token_id: gamcaTokenId };
    
    const result = await createGamcaTokenPayment(payload, globalThis.env.DB);
    
    return c.json(
      {
        status: result.status,
        message: result.message,
        ...(result.payment && { payment: result.payment }),
        ...(result.gamca_token && { gamca_token: result.gamca_token }),
        ...(result.errors && { errors: result.errors }),
      },
      result.code
    );
  } catch (error) {
    console.error('Error creating GAMCA token payment:', error);
    return c.json(
      {
        status: 'error',
        message: 'Failed to create GAMCA token payment'
      },
      500
    );
  }
});

// Route to get payment history for a specific GAMCA token record
app.get('/gamca-token/:id/payments', async (c) => {
  try {
    const gamcaTokenId = parseInt(c.req.param('id'));
    if (isNaN(gamcaTokenId)) {
      return c.json({ status: 'error', code: 400, message: 'Invalid GAMCA Token ID' }, 400);
    }
    
    const result = await getGamcaTokenPaymentsByTokenId(gamcaTokenId, globalThis.env.DB);
    
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
    console.error('Error fetching GAMCA token payment history:', error);
    return c.json(
      {
        status: 'error',
        message: 'Failed to fetch GAMCA token payment history'
      },
      500
    );
  }
});

// Standalone routes (similar to your other payment routes)
// POST route for creating GAMCA token payments
app.post('/gamca_token_payments', async (c) => {
  try {
    const body = await c.req.json();

    // Call the create GAMCA token payment service
    const result = await createGamcaTokenPayment(body, globalThis.env.DB);

    // Return the result from the service
    return c.json(
      {
        status: result.status,
        message: result.message,
        ...(result.payment && { payment: result.payment }),
        ...(result.gamca_token && { gamca_token: result.gamca_token }),
        ...(result.errors && { errors: result.errors }),
      },
      result.code
    );
  } catch (error) {
    console.error('Error creating GAMCA token payment:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to create GAMCA token payment',
      },
      500
    );
  }
});

// GET route for fetching GAMCA token payments by token ID
app.get('/gamca_token_payments/:gamcaTokenId', async (c) => {
  try {
    const gamcaTokenId = Number(c.req.param('gamcaTokenId'));

    if (isNaN(gamcaTokenId)) {
      return c.json(
        {
          status: 'error',
          message: 'Invalid GAMCA Token ID',
        },
        400
      );
    }

    // Call the get GAMCA token payments service
    const result = await getGamcaTokenPaymentsByTokenId(gamcaTokenId, globalThis.env.DB);

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
    console.error('Error fetching GAMCA token payments:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to fetch GAMCA token payments',
      },
      500
    );
  }
});

// Update a GAMCA token payment
app.put('/gamca-token/payment/:id', async (c) => {
  try {
    const paymentId = Number(c.req.param('id'));
    if (isNaN(paymentId)) {
      return c.json({ status: 'error', code: 400, message: 'Invalid payment ID' }, 400);
    }

    const body = await c.req.json();
    const result = await updateGamcaTokenPayment(paymentId, body, globalThis.env.DB);

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
    console.error('Error updating GAMCA token payment:', error);
    return c.json({ status: 'error', message: 'Failed to update GAMCA token payment' }, 500);
  }
});

// Delete a GAMCA token payment
app.delete('/gamca-token/payment/:id', async (c) => {
  try {
    const paymentId = Number(c.req.param('id'));
    if (isNaN(paymentId)) {
      return c.json({ status: 'error', code: 400, message: 'Invalid payment ID' }, 400);
    }

    const result = await deleteGamcaTokenPayment(paymentId, globalThis.env.DB);

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
    console.error('Error deleting GAMCA token payment:', error);
    return c.json({ status: 'error', message: 'Failed to delete GAMCA token payment' }, 500);
  }
});