import app from '../app';
import { createVisaProcessing, updateVisaProcessing, deleteVisaProcessing } from '../services/visaProcessing';

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
  
      // Call the deleteVisaProcessing service
      const result = await deleteVisaProcessing(id, globalThis.env.DB);
  
      // Return the result from the service
      return c.json(
        {
          status: result.status,
          message: result.message,
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
