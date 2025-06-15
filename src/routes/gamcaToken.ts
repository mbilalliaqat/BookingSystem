import app from '../app';
import { createGamcaToken,  updateGamcaToken, deleteGamcaToken  } from '../services/gamcaToken'; 

app.post('/gamca-token', async (c) => {
  try {
    
    const body = await c.req.json();

    const result = await createGamcaToken(body, globalThis.env.DB);

    
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
    console.error('Error creating gamca token record:', error);

   
    return c.json(
      {
        status: 'error',
        message: 'Failed to create gamca token record',
      },
      500
    );
  }
});

app.get('/gamca-token', async (c) => {
    try {
      // Access the database from global environment
      const db = globalThis.env.DB;
  
      // Fetch all GAMCA token entries
      const gamcaTokens = await db
        .selectFrom('gamca_token')
        .selectAll()
        .execute();
  
      return c.json(
        {
          status: 'success',
          gamcaTokens: gamcaTokens
        },
        200
      );
    } catch (error) {
      console.error('Error fetching gamca tokens:', error);
  
      return c.json(
        {
          status: 'error',
          message: 'Failed to fetch gamca tokens',
          details: error.message
        },
        500
      );
    }
  });

  app.put('/gamca-token/:id', async (c) => {
    try {
      const id = Number(c.req.param('id'));
      const body = await c.req.json();
  
      // Call the updateGamcaToken service
      const result = await updateGamcaToken(id, body, globalThis.env.DB);
  
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
      console.error('Error updating gamca token record:', error);
  
      return c.json(
        {
          status: 'error',
          message: 'Failed to update gamca token record',
        },
        500
      );
    }
  });
  
  app.delete('/gamca-token/:id', async (c) => {
    try {
      const id = Number(c.req.param('id'));
  
      // Call the deleteGamcaToken service
      const result = await deleteGamcaToken(id, globalThis.env.DB);
  
      // Return the result from the service
      return c.json(
        {
          status: result.status,
          message: result.message,
        },
        result.code
      );
    } catch (error) {
      console.error('Error deleting gamca token record:', error);
  
      return c.json(
        {
          status: 'error',
          message: 'Failed to delete gamca token record',
        },
        500
      );
    }
  });
  
