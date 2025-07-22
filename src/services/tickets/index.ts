import { incrementEntryCounts  } from "../counters";

// Helper function to convert empty strings to null for date fields
const formatDateForDB = (dateStr: string | null | undefined): string | null => {
  if (!dateStr || dateStr.trim() === '') {
    return null;
  }
  return dateStr;
};

export const createTicket = async (body: any, db: any) => {
  try {
    const now = new Date();
    const [currentEntryNumber] = body.entry.split('/').map(Number); // Extract current entry number

    const newTicket = await db
      .insertInto('ticket')
      .values({
        employee_name: body.employee_name,
        entry: body.entry,
        customer_add: body.customer_add,
        reference: body.reference || null, // Handle empty string
        depart_date: formatDateForDB(body.depart_date), // Convert empty string to null
        return_date: formatDateForDB(body.return_date), // Convert empty string to null
        sector: body.sector,
        airline: body.airline,
        adults: body.adults,
        children: body.children,
        infants: body.infants,
        passport_detail: body.passport_detail,
        receivable_amount: body.receivable_amount,
        paid_cash: body.paid_cash || 0,
        bank_title: body.bank_title,
        paid_in_bank: body.paid_in_bank || 0,
        payable_to_vendor: body.payable_to_vendor,
        vendor_name: body.vendor_name || null,
        agent_name: body.agent_name || null,
        profit: body.profit || 0,
        remaining_amount: body.remaining_amount || 0,
        created_at: now,
      })
      .returningAll()
      .executeTakeFirst();

    if (newTicket) {
      await incrementEntryCounts('ticket', currentEntryNumber, db); 
    }

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
        employee_name: body.employee_name,               
        entry: body.entry,
        customer_add: body.customer_add,
        reference: body.reference || null, // Handle empty string
        depart_date: formatDateForDB(body.depart_date), // Convert empty string to null
        return_date: formatDateForDB(body.return_date), // Convert empty string to null
        sector: body.sector,
        airline: body.airline,
        adults: body.adults, 
        children: body.children, 
        infants: body.infants,
        passport_detail: body.passport_detail,
        receivable_amount: body.receivable_amount,
        paid_cash: body.paid_cash || 0,
        bank_title: body.bank_title,
        paid_in_bank: body.paid_in_bank || 0,
        payable_to_vendor: body.payable_to_vendor,
        vendor_name: body.vendor_name || null,
        agent_name: body.agent_name || null,
        profit: body.profit || 0,
        remaining_amount: body.remaining_amount || 0,
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

export const deleteTicket = async (id: number, db: any) => {
  try {
    const deleteTicket = await db
      .deleteFrom('ticket')  // Fixed from deleteForm to deleteFrom
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!deleteTicket) {
      return {
        status: 'error',
        code: 404,
        message: 'Ticket not found'
      };
    }
    return {
      status: 'success',
      code: 200,
      message: 'Ticket deleted successfully',
      ticket: deleteTicket,
    };
  } catch (error) {
    console.error("Error in deleteTicket service:", error)
    return {
      status: 'error',
      code: 500,
      message: 'Failed to delete ticket',
      errors: error.message,
    };
  }
};