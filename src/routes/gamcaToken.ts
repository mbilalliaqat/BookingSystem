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

// Get all GAMCA tokens
app.get('/gamca-token', async (c) => {
  try {
    const db = globalThis.env.DB;
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

// *** NEW ROUTE *** Get single GAMCA token by ID
app.get('/gamca-token/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json(
        {
          status: 'error',
          message: 'Invalid GAMCA Token ID',
        },
        400
      );
    }

    const db = globalThis.env.DB;
    const gamcaToken = await db
      .selectFrom('gamca_token')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!gamcaToken) {
      return c.json(
        {
          status: 'error',
          message: 'GAMCA token not found',
        },
        404
      );
    }

    return c.json(
      {
        status: 'success',
        gamcaToken: gamcaToken
      },
      200
    );
  } catch (error) {
    console.error('Error fetching gamca token:', error);
    return c.json(
      {
        status: 'error',
        message: 'Failed to fetch gamca token',
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
    const result = await updateGamcaToken(id, body, globalThis.env.DB);
  
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
    const deletedBy = c.req.header('X-User-Name') || 'system';
    const result = await deleteGamcaToken(id, globalThis.env.DB, deletedBy);

    return c.json(
      {
        status: result.status,
        message: result.message,
        ...(result.data && { data: result.data }),
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