import app from '../app';
import { createTicket, updateTicket, deleteTicket,
  //  getTickets, 
  // getTicketById,
  createPayment,         // <--- Add this import
  getPaymentsByTicketId,
    updatePayment,      // <--- Add this
  deletePayment,
 } from '../services/tickets';


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

  app.post('/ticket/:id/payments', async (c) => {
  try {
    const ticketId = parseInt(c.req.param('id'));
    if (isNaN(ticketId)) {
      return c.json({ status: 'error', code: 400, message: 'Invalid Ticket ID' }, 400);
    }
    const body = await c.req.json();
    // Add the ticket_id from the URL parameter to the body for the service function
    const payload = { ...body, ticket_id: ticketId };
    const result = await createPayment(payload, globalThis.env.DB);
    return c.json(result, result.code);
  } catch (error) {
    console.error('Error creating payment:', error);
    return c.json({ status: 'error', message: 'Failed to create payment' }, 500);
  }
});

// Route to get payment history for a specific ticket
app.get('/ticket/:id/payments', async (c) => {
  try {
    const ticketId = parseInt(c.req.param('id'));
    if (isNaN(ticketId)) {
      return c.json({ status: 'error', code: 400, message: 'Invalid Ticket ID' }, 400);
    }
    const result = await getPaymentsByTicketId(ticketId, globalThis.env.DB);
    return c.json(result, result.code);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return c.json({ status: 'error', message: 'Failed to fetch payment history' }, 500);
  }
});

app.put('/ticket_payments/:id', async (c) => {
  try {
    const paymentId = parseInt(c.req.param('id'));
    if (isNaN(paymentId)) {
      return c.json({ status: 'error', code: 400, message: 'Invalid Payment ID' }, 400);
    }
    const body = await c.req.json();
    const result = await updatePayment(paymentId, body, globalThis.env.DB);
    return c.json(result, result.code);
  } catch (error) {
    console.error('Error updating payment:', error);
    return c.json({ status: 'error', message: 'Failed to update payment' }, 500);
  }
});

// Route to delete a payment
app.delete('/ticket_payments/:id', async (c) => {
  try {
    const paymentId = parseInt(c.req.param('id'));
    if (isNaN(paymentId)) {
      return c.json({ status: 'error', code: 400, message: 'Invalid Payment ID' }, 400);
    }
    const result = await deletePayment(paymentId, globalThis.env.DB);
    return c.json(result, result.code);
  } catch (error) {
    console.error('Error deleting payment:', error);
    return c.json({ status: 'error', message: 'Failed to delete payment' }, 500);
  }
});