import app from '../app';
import { createNavtcc, updateNavtcc, deleteNavtcc  } from '../services/navtcc';


app.post('/navtcc', async (c) => {
    try {
      const body = await c.req.json();
  
      
      const result = await createNavtcc(body, globalThis.env.DB);
  
      // Return the result from the service
      return c.json(
        {
          status: result.status,
          message: result.message,
          ...(result.navtcc && { navtcc: result.navtcc }),
          ...(result.errors && { errors: result.errors }),
        },
        result.code
      );
    } catch (error) {
      console.error('Error creating navtcc:', error);
  
      return c.json(
        {
          status: 'error',
          message: 'Failed to create navtcc',
        },
        500
      );
    }
  });

  app.get('/navtcc', async (c) => {
    try {
      // Access the database from global environment
      const db = globalThis.env.DB;
  
    
      const navtcc = await db
        .selectFrom('navtcc')
        .selectAll()
        .execute();
  
      return c.json(
        {
          status: 'success',
          navtcc: navtcc
        },
        200
      );
    } catch (error) {
      console.error('Error fetching Navtcc:', error);
  
      return c.json(
        {
          status: 'error',
          message: 'Failed to fetch Navtcc',
          details: error.message
        },
        500
      );
    }
  });

  app.put('/navtcc/:id',async(c)=>{
    try{
      const id =Number(c.req.param('id'));
      const body = await c.req.json();

      const result = await updateNavtcc(id,body,globalThis.env.DB)
      return c.json(
        {
          status:result.status,
          message:result.message,
          ...(result.navtcc && {navtcc:result.navtcc}),
          ...(result.errors && {navtcc:result.errors}),
        },
        result.code
      );
    }
    catch(error){
      console.error("Error updating navtcc:",error)
      return c.json(
        {
          status:'error',
          message:'Failed to update navtcc',
        },
        500
      );
    }
  });

  app.delete('/navtcc/:id', async (c) => {
    try {
      const id = Number(c.req.param('id'));
      const deletedBy = c.req.header('X-User-Name') || 'system';
  
      const result = await deleteNavtcc(id, globalThis.env.DB, deletedBy);
  
    
      return c.json(
        {
          status: result.status,
          message: result.message,
          ...(result.data && { navtcc: result.data }),
          ...(result.errors && { errors: result.errors }),
        },
        result.code
      );
    } catch (error) {
      console.error('Error deleting navtcc:', error);
  
      return c.json(
        {
          status: 'error',
          message: 'Failed to delete navtcc',
        },
        500
      );
    }
  });