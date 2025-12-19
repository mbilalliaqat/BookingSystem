import app from '../app';
import { createVisaProcessing, updateVisaProcessing, deleteVisaProcessing, createVisaPayment, getVisaPaymentsByProcessingId, updateVisaPayment, deleteVisaPayment } from '../services/visaProcessing';

app.post('/visa-processing', async (c) => {
  try {
    const body = await c.req.json();

    // Call the createVisaProcessing service
    const result = await createVisaProcessing(body, globalThis.env.DB);

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
    console.error('Error creating visa processing record:', error);

    return c.json(
      {
        status: 'error',
        message: 'Failed to create visa processing record',
      },
      500
    );
  }
});

app.get('/visa-processing', async (c) => {
    try {
      // Access the database from global environment
      const db = globalThis.env.DB;
  
      // Fetch all visa processing entries
      const visa_processing = await db
        .selectFrom('visa_processing')
        .selectAll()
        .execute();
  
      return c.json(
        {
          status: 'success',
          visa_processing: visa_processing
        },
        200
      );
    } catch (error) {
      console.error('Error fetching Ticket:', error);
  
      return c.json(
        {
          status: 'error',
          message: 'Failed to fetch Ticket',
          details: error.message
        },
        500
      );
    }
  });

  app.put('/visa-processing/:id', async (c) => {
    try {
      const id = Number(c.req.param('id'));
      const body = await c.req.json();
  
      // Call the updateVisaProcessing service
      const result = await updateVisaProcessing(id, body, globalThis.env.DB);
  
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
      console.error('Error updating visa processing record:', error);
  
      return c.json(
        {
          status: 'error',
          message: 'Failed to update visa processing record',
        },
        500
      );
    }
  });
  
  // New DELETE route for deleting a visa processing record
  app.delete('/visa-processing/:id', async (c) => {
    try {
      const id = Number(c.req.param('id'));
      const deletedBy = c.req.header('X-User-Name') || 'system';

      // Call the deleteVisaProcessing service
      const result = await deleteVisaProcessing(id, globalThis.env.DB, deletedBy);

      // Return the result from the service
      return c.json(
        {
          status: result.status,
          message: result.message,
          ...(result.errors && { errors: result.errors }),
        },
        result.code
      );
    } catch (error) {
      console.error('Error deleting visa processing record:', error);

      return c.json(
        {
          status: 'error',
          message: 'Failed to delete visa processing record',
        },
        500
      );
    }
  });

// Visa processing payment routes
app.post('/visa-processing/payment', async (c) => {
  try {
    const body = await c.req.json();
    const result = await createVisaPayment(body, globalThis.env.DB);
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
    console.error('Error creating visa payment:', error);
    return c.json({ status: 'error', message: 'Failed to create visa payment' }, 500);
  }
});

app.get('/visa-processing/:id/payments', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const result = await getVisaPaymentsByProcessingId(id, globalThis.env.DB);
    return c.json(
      {
        status: result.status,
        message: result.message,
        payments: result.payments,
      },
      result.code
    );
  } catch (error) {
    console.error('Error fetching visa payments:', error);
    return c.json({ status: 'error', message: 'Failed to fetch visa payments' }, 500);
  }
});

app.put('/visa-processing/payment/:id', async (c) => {
  try {
    const paymentId = Number(c.req.param('id'));
    const body = await c.req.json();
    const result = await updateVisaPayment(paymentId, body, globalThis.env.DB);
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
    console.error('Error updating visa payment:', error);
    return c.json({ status: 'error', message: 'Failed to update visa payment' }, 500);
  }
});

app.delete('/visa-processing/payment/:id', async (c) => {
  try {
    const paymentId = Number(c.req.param('id'));
    const result = await deleteVisaPayment(paymentId, globalThis.env.DB);
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
    console.error('Error deleting visa payment:', error);
    return c.json({ status: 'error', message: 'Failed to delete visa payment' }, 500);
  }
});
