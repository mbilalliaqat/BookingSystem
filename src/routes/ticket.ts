import app from '../app';
import { createTicket, updateTicket, deleteTicket  } from '../services/tickets';


app.post('/ticket', async (c) => {
    try {
      const body = await c.req.json();
  
      // Call the create ticket service
      const result = await createTicket(body, globalThis.env.DB);
  
      // Return the result from the service
      return c.json(
        {
          status: result.status,
          message: result.message,
          ...(result.ticket && { ticket: result.ticket }),
          ...(result.errors && { errors: result.errors }),
        },
        result.code
      );
    } catch (error) {
      console.error('Error creating ticket:', error);
  
      return c.json(
        {
          status: 'error',
          message: 'Failed to create ticket',
        },
        500
      );
    }
  });

  app.get('/ticket', async (c) => {
    try {
      // Access the database from global environment
      const db = globalThis.env.DB;
  
    
      const ticket = await db
        .selectFrom('ticket')
        .selectAll()
        .execute();
  
      return c.json(
        {
          status: 'success',
          ticket: ticket
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

  app.put('/ticket/:id',async(c)=>{
    try{
      const id =Number(c.req.param('id'));
      const body = await c.req.json();

      const result = await updateTicket(id,body,globalThis.env.DB)
      return c.json(
        {
          status:result.status,
          message:result.message,
          ...(result.ticket && {ticket:result.ticket}),
          ...(result.errors && {ticket:result.errors}),
        },
        result.code
      );
    }
    catch(error){
      console.error("Error updating ticket:",error)
      return c.json(
        {
          status:'error',
          message:'Failed to update ticket',
        },
        500
      );
    }
  });

  app.delete('/ticket/:id', async (c) => {
    try {
      const id = Number(c.req.param('id'));
  
      // Call the delete ticket service
      const result = await deleteTicket (id, globalThis.env.DB);
  
      // Return the result from the service
      return c.json(
        {
          status: result.status,
          message: result.message,
          ...(result.ticket && { ticket: result.ticket }),
          ...(result.errors && { errors: result.errors }),
        },
        result.code
      );
    } catch (error) {
      console.error('Error deleting ticket:', error);
  
      return c.json(
        {
          status: 'error',
          message: 'Failed to delete ticket',
        },
        500
      );
    }
  });