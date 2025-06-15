export const createTicket = async (body: any, db: any) => {
    try {
      const now = new Date();
      
      const newTicket = await db
        .insertInto('ticket')
        .values({
            employee_name: body.employee_name,               // changed from 'username'
            entry: body.entry,
            customer_add: body.customer_add,
            reference: body.reference,
            depart_date: body.depart_date,
            return_date:body.return_date,
            sector: body.sector,
            airline: body.airline,
             adults: body.adults, // Update adults field
            children: body.children, // Update children field
            infants: body.infants,
            passport_detail: body.passport_detail,
            receivable_amount: body.receivable_amount,
            paid_cash: body.paid_cash,
            bank_title:body.bank_title,
            paid_in_bank: body.paid_in_bank,
            payable_to_vendor: body.payable_to_vendor,
            vendor_name: body.vendor_name,
            profit: body.profit,
            remaining_amount: body.remaining_amount,
            created_at: now,
          
        })
        .returningAll()
        .executeTakeFirst();
  
      return {
        status: 'success',
        code: 201,
        message: 'Ticket created successfully',
        ticket: newTicket
      };
    } catch (error) {
      console.error('Error in createTicket service:', error);
      return {
        status: 'error',
        code: 500,
        message: 'Failed to create ticket',
        errors: error.message
      };
    }
  };

  export const updateTicket = async (id: number, body: any, db: any) => {
    try {
      const now = new Date();
      const updatedTicket = await db
        .updateTable('ticket')
        .set({
          employee_name: body.employee_name,               // changed from 'username'
            entry: body.entry,
            customer_add: body.customer_add,
            reference: body.reference,
            depart_date: body.depart_date,
            return_date:body.return_date,
            sector: body.sector,
            airline: body.airline,
             adults: body.adults, 
            children: body.children, 
            infants: body.infants,
            passport_detail: body.passport_detail,
            receivable_amount: body.receivable_amount,
            paid_cash: body.paid_cash,
            bank_title:body.bank_title,
            paid_in_bank: body.paid_in_bank,
            payable_to_vendor: body.payable_to_vendor,
            vendor_name: body.vendor_name,
            profit: body.profit,
            remaining_amount: body.remaining_amount,
            created_at: now,
        })
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
  
      if (!updatedTicket) {
        return {
          status: 'error',
          code: 404,
          message: 'Ticket not found',
        };
      }
  
      return {
        status: 'success',
        code: 200,
        message: 'Ticket updated successfully',
        ticket: updatedTicket,
      };
    } catch (error) {
      console.error('Error in updateTicket service:', error);
      return {
        status: 'error',
        code: 500,
        message: 'Failed to update ticket',
        errors: error.message,
      };
    }
  };
  

  export const deleteTicket  = async (id:number, db:any)=>{
    try{
      const deleteTicket =await db
     .deleteFrom('ticket')  // Fixed from deleteForm to deleteFrom
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

      if(!deleteTicket){
        return {
          status:'error',
          code:404,
          message:'Ticket not found'
        };
      }
      return {
        status:'success',
        code:200,
        message:'Ticket deleted successfully',
        ticket:deleteTicket,
      };
    }
    catch(error){
      console.error("Error in deleteTicket service:",error)
      return {
        status:'error',
        code:500,
        message:'Failed to delete ticket',
        errors:error.message,
      };
    }
  };

  