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


export const createPayment = async (body: any, db: any) => {
  try {
    const now = new Date();

    // First, fetch the current ticket to get its remaining_amount, paid_cash, and paid_in_bank
    const currentTicket = await db
      .selectFrom('ticket')
      .select(['remaining_amount', 'paid_cash', 'paid_in_bank']) // Select existing paid amounts
      .where('id', '=', body.ticket_id)
      .executeTakeFirst();

    if (!currentTicket) {
      return {
        status: 'error',
        code: 404,
        message: 'Ticket not found for payment update',
      };
    }

    const amountPaidCash = parseFloat(body.payment_amount) || 0; // This is the cash amount from frontend
    const amountPaidBank = parseFloat(body.paid_bank) || 0; // This is the bank amount from frontend

    const currentRemaining = parseFloat(currentTicket.remaining_amount) || 0;
    const currentPaidCash = parseFloat(currentTicket.paid_cash) || 0;
    const currentPaidInBank = parseFloat(currentTicket.paid_in_bank) || 0;

    const newRemainingAmountForTicket = currentRemaining - (amountPaidCash + amountPaidBank); // Deduct total paid
    const newPaidCash = currentPaidCash + amountPaidCash; // Increment paid cash
    const newPaidInBank = currentPaidInBank + amountPaidBank; // Increment paid in bank

    // Insert new payment record into ticket_payments table
    const newPayment = await db
      .insertInto('ticket_payments')
      .values({
        ticket_id: body.ticket_id,
        payment_date: formatDateForDB(body.payment_date) || now.toISOString().split('T')[0],
        payed_cash: amountPaidCash.toString(), // Store cash amount in this payment
        paid_bank: amountPaidBank.toString(), // Store bank amount in this payment
        bank_title: body.bank_title || null,
        recorded_by: body.recorded_by,
        created_at: now,
        remaining_amount: newRemainingAmountForTicket, // Store the remaining amount after this payment
      })
      .returningAll()
      .executeTakeFirst();

    // Update the main 'ticket' table with new remaining, paid_cash, and paid_in_bank amounts
    const updatedTicket = await db
      .updateTable('ticket')
      .set({
        remaining_amount: newRemainingAmountForTicket,
        paid_cash: newPaidCash, // Update paid_cash in main ticket table
        paid_in_bank: newPaidInBank, // Update paid_in_bank in main ticket table
      })
      .where('id', '=', body.ticket_id)
      .returningAll()
      .executeTakeFirst();

    return {
      status: 'success',
      code: 201,
      message: 'Payment recorded and ticket amounts updated successfully',
      payment: newPayment,
      ticket: updatedTicket, // Return updated ticket details as well
    };
  } catch (error) {
    console.error('Error in createPayment service:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to record payment or update ticket',
      errors: error.message,
    };
  }
};

export const getPaymentsByTicketId = async (ticketId: number, db: any) => {
  try {
    const payments = await db
      .selectFrom('ticket_payments')
      .selectAll()
      .where('ticket_id', '=', ticketId)
      .orderBy('created_at', 'asc') // Order by creation timestamp for chronological history
      .execute();

    if (!payments || payments.length === 0) {
      return {
        status: 'success',
        code: 200,
        message: 'No payments found for this ticket',
        payments: [],
      };
    }

    return {
      status: 'success',
      code: 200,
      message: 'Payment history fetched successfully',
      payments: payments,
    };
  } catch (error) {
    console.error('Error in getPaymentsByTicketId service:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch payment history',
      errors: error.message,
    };
  }
};