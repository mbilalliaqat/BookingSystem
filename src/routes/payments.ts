import app from '../app';
import { createPayment, getPaymentsByTicketId } from '../services/tickets/index';

// POST route for creating payments
app.post('/ticket_payments', async (c) => {
  try {
    const body = await c.req.json();

    // Call the create payment service
    const result = await createPayment(body, globalThis.env.DB);

    // Return the result from the service
    return c.json(
      {
        status: result.status,
        message: result.message,
        ...(result.payment && { payment: result.payment }),
        ...(result.ticket && { ticket: result.ticket }),
        ...(result.errors && { errors: result.errors }),
      },
      result.code
    );
  } catch (error) {
    console.error('Error creating payment:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to create payment',
      },
      500
    );
  }
});

// GET route for fetching payments by ticket ID
app.get('/ticket_payments/:ticketId', async (c) => {
  try {
    const ticketId = Number(c.req.param('ticketId'));

    if (isNaN(ticketId)) {
      return c.json(
        {
          status: 'error',
          message: 'Invalid ticket ID',
        },
        400
      );
    }

    // Call the get payments service
    const result = await getPaymentsByTicketId(ticketId, globalThis.env.DB);

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
    console.error('Error fetching payments:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to fetch payments',
      },
      500
    );
  }
});