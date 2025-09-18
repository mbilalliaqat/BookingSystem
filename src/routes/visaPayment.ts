import app from '../app';
import { createVisaProcessing, updateVisaProcessing, deleteVisaProcessing, createVisaPayment, getVisaPaymentsByProcessingId } from '../services/visaProcessing';

// Route to create payment for a specific visa processing record
app.post('/visa-processing/:id/payments', async (c) => {
  try {
    const visaProcessingId = parseInt(c.req.param('id'));
    if (isNaN(visaProcessingId)) {
      return c.json({ status: 'error', code: 400, message: 'Invalid Visa Processing ID' }, 400);
    }
    
    const body = await c.req.json();
    
    // Add the visa_processing_id from the URL parameter to the body for the service function
    const payload = { ...body, visa_processing_id: visaProcessingId };
    
    const result = await createVisaPayment(payload, globalThis.env.DB);
    
    return c.json(
      {
        status: result.status,
        message: result.message,
        ...(result.payment && { payment: result.payment }),
        ...(result.visa_processing && { visa_processing: result.visa_processing }),
        ...(result.errors && { errors: result.errors }),
      },
      result.code
    );
  } catch (error) {
    console.error('Error creating visa processing payment:', error);
    return c.json(
      {
        status: 'error',
        message: 'Failed to create visa processing payment'
      },
      500
    );
  }
});

// Route to get payment history for a specific visa processing record
app.get('/visa-processing/:id/payments', async (c) => {
  try {
    const visaProcessingId = parseInt(c.req.param('id'));
    if (isNaN(visaProcessingId)) {
      return c.json({ status: 'error', code: 400, message: 'Invalid Visa Processing ID' }, 400);
    }
    
    const result = await getVisaPaymentsByProcessingId(visaProcessingId, globalThis.env.DB);
    
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
    console.error('Error fetching visa processing payment history:', error);
    return c.json(
      {
        status: 'error',
        message: 'Failed to fetch visa processing payment history'
      },
      500
    );
  }
});

// Standalone routes (similar to your ticket_payments routes)
// POST route for creating visa processing payments
app.post('/visa_processing_payments', async (c) => {
  try {
    const body = await c.req.json();

    // Call the create visa payment service
    const result = await createVisaPayment(body, globalThis.env.DB);

    // Return the result from the service
    return c.json(
      {
        status: result.status,
        message: result.message,
        ...(result.payment && { payment: result.payment }),
        ...(result.visa_processing && { visa_processing: result.visa_processing }),
        ...(result.errors && { errors: result.errors }),
      },
      result.code
    );
  } catch (error) {
    console.error('Error creating visa processing payment:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to create visa processing payment',
      },
      500
    );
  }
});

// GET route for fetching visa processing payments by visa processing ID
app.get('/visa_processing_payments/:visaProcessingId', async (c) => {
  try {
    const visaProcessingId = Number(c.req.param('visaProcessingId'));

    if (isNaN(visaProcessingId)) {
      return c.json(
        {
          status: 'error',
          message: 'Invalid Visa Processing ID',
        },
        400
      );
    }

    // Call the get visa processing payments service
    const result = await getVisaPaymentsByProcessingId(visaProcessingId, globalThis.env.DB);

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
    console.error('Error fetching visa processing payments:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to fetch visa processing payments',
      },
      500
    );
  }
});