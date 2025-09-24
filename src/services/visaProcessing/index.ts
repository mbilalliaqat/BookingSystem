import { incrementEntryCounts } from "../counters";

// Helper function to convert empty strings to null for date fields
const formatDateForDB = (dateStr: string | null | undefined): string | null => {
  if (!dateStr || dateStr.trim() === '') {
    return null;
  }
  return dateStr;
};



export const createVisaProcessing = async (body: any, db: any) => {
  try {
    const now = new Date();
    const [currentEntryNumber] = body.entry.split('/').map(Number);

    const newVisaProcessing = await db
      .insertInto('visa_processing')
      .values({
        employee_name: body.employee_name,
        entry: body.entry,
        file_number: body.file_number,
        reference: body.reference,
        sponsor_name: body.sponsor_name,
        visa_number: body.visa_number,
        id_number: body.id_number,
        embassy: body.embassy,
        passport_detail: body.passport_detail,
        e_number: body.e_number,
        customer_add: body.customer_add,
        ptn_permission: body.ptn_permission,
        embassy_send_date: formatDateForDB(body.embassy_send_date),
        embassy_return_date: formatDateForDB(body.embassy_return_date),
        protector_date: formatDateForDB(body.protector_date),
        passport_deliver_date: formatDateForDB(body.passport_deliver_date),
        receivable_amount: body.receivable_amount,
        additional_charges: body.additional_charges,
        pay_for_protector: body.pay_for_protector,
        paid_cash: body.paid_cash || 0,
        paid_in_bank: body.paid_in_bank || 0,
        profit: body.profit || 0,
        remaining_amount: body.remaining_amount || 0,
        // Add initial payment tracking fields
        initial_paid_cash: body.paid_cash || 0,
        initial_paid_in_bank: body.paid_in_bank || 0,
        created_at: now
      })
      .returningAll()
      .executeTakeFirst();

    if (newVisaProcessing) {
      await incrementEntryCounts('visa', currentEntryNumber, db);
    }

    return {
      status: 'success',
      code: 201,
      message: 'Visa processing entry created successfully',
      data: newVisaProcessing
    };
  } catch (error) {
    console.error('Error in createVisaProcessing service:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to create visa processing entry',
      errors: error.message
    };
  }
};

export const updateVisaProcessing = async (id: number, body: any, db: any) => {
  try {
    // Get current visa processing data to preserve initial values
    const currentVisaProcessing = await db
      .selectFrom('visa_processing')
      .select(['initial_paid_cash', 'initial_paid_in_bank'])
      .where('id', '=', id)
      .executeTakeFirst();

    const updatedVisaProcessing = await db
      .updateTable('visa_processing')
      .set({
        employee_name: body.employee_name,
        entry: body.entry,
        file_number: body.file_number,
        reference: body.reference,
        sponsor_name: body.sponsor_name,
        visa_number: body.visa_number,
        id_number: body.id_number,
        embassy: body.embassy,
        passport_detail: body.passport_detail,
        e_number: body.e_number,
        customer_add: body.customer_add,
        ptn_permission: body.ptn_permission,
        embassy_send_date: formatDateForDB(body.embassy_send_date),
        embassy_return_date: formatDateForDB(body.embassy_return_date),
        protector_date: formatDateForDB(body.protector_date),
        passport_deliver_date: formatDateForDB(body.passport_deliver_date),
        receivable_amount: body.receivable_amount,
        additional_charges: body.additional_charges,
        pay_for_protector: body.pay_for_protector,
        paid_cash: body.paid_cash || 0,
        paid_in_bank: body.paid_in_bank || 0,
        profit: body.profit || 0,
        remaining_amount: body.remaining_amount || 0,
        // Preserve initial values or set them if they don't exist
        initial_paid_cash: currentVisaProcessing?.initial_paid_cash || body.paid_cash || 0,
        initial_paid_in_bank: currentVisaProcessing?.initial_paid_in_bank || body.paid_in_bank || 0,
        updated_at: new Date()
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!updatedVisaProcessing) {
      return {
        status: 'error',
        code: 404,
        message: 'Visa processing record not found'
      };
    }

    return {
      status: 'success',
      code: 200,
      message: 'Visa processing record updated successfully',
      data: updatedVisaProcessing
    };
  } catch (error) {
    console.error('Error in updateVisaProcessing service:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to update visa processing record',
      errors: error.message
    };
  }
};

// Fixed createVisaPayment function in visaProcessing/index.ts
export const createVisaPayment = async (body: any, db: any) => {
  try {
    const now = new Date();

    // Get current visa processing data
    const currentVisaProcessing = await db
      .selectFrom('visa_processing')
      .select(['remaining_amount', 'paid_cash', 'paid_in_bank', 'initial_paid_cash', 'initial_paid_in_bank'])
      .where('id', '=', body.visa_processing_id)
      .executeTakeFirst();

    if (!currentVisaProcessing) {
      return {
        status: 'error',
        code: 404,
        message: 'Visa processing record not found for payment update',
      };
    }

    // FIXED: Use consistent field names with frontend
    // Frontend sends 'payed_cash' and 'paid_bank', not 'payment_amount' and 'paid_bank'
    const amountPaidCash = parseFloat(body.payed_cash) || 0;  // Changed from body.payment_amount
    const amountPaidBank = parseFloat(body.paid_bank) || 0;
    const totalPaymentAmount = amountPaidCash + amountPaidBank;

    // Parse current values - ensure they're numbers
    const currentRemaining = parseFloat(currentVisaProcessing.remaining_amount) || 0;
    const currentPaidCash = parseFloat(currentVisaProcessing.paid_cash) || 0;
    const currentPaidInBank = parseFloat(currentVisaProcessing.paid_in_bank) || 0;

    // Calculate new values
    const newRemainingAmount = Math.max(0, currentRemaining - totalPaymentAmount);
    const newPaidCash = currentPaidCash + amountPaidCash;
    const newPaidInBank = currentPaidInBank + amountPaidBank;

    // Validate that payment doesn't exceed remaining amount
    if (totalPaymentAmount > currentRemaining) {
      return {
        status: 'error',
        code: 400,
        message: `Payment amount (${totalPaymentAmount}) exceeds remaining amount (${currentRemaining})`,
      };
    }

    // FIXED: Store values as strings to match your database schema and ticket implementation
    const newPayment = await db
      .insertInto('visa_processing_payments')
      .values({
        visa_processing_id: body.visa_processing_id,
        payment_date: formatDateForDB(body.payment_date) || now.toISOString().split('T')[0],
        payed_cash: amountPaidCash.toString(),  // Convert to string
        paid_bank: amountPaidBank.toString(),   // Convert to string
        bank_title: body.bank_title || null,
        recorded_by: body.recorded_by,
        created_at: now,
        remaining_amount: newRemainingAmount.toString(), // Convert to string to match schema
      })
      .returningAll()
      .executeTakeFirst();

    // Update visa processing record - KEEP initial values unchanged
    const updatedVisaProcessing = await db
      .updateTable('visa_processing')
      .set({
        remaining_amount: newRemainingAmount,
        paid_cash: newPaidCash,
        paid_in_bank: newPaidInBank,
        updated_at: now
      })
      .where('id', '=', body.visa_processing_id)
      .returningAll()
      .executeTakeFirst();

    return {
      status: 'success',
      code: 201,
      message: 'Payment recorded and visa processing amounts updated successfully',
      payment: newPayment,
      visa_processing: updatedVisaProcessing,
    };
  } catch (error) {
    console.error('Error in createVisaPayment service:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to record payment or update visa processing record',
      errors: error.message,
    };
  }
};
  
// Fixed deleteVisaProcessing function in visaProcessing/index.ts
export const deleteVisaProcessing = async (id: number, db: any) => {
  try {
    // First, check if the visa processing record exists
    const visaProcessingRecord = await db
      .selectFrom('visa_processing')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!visaProcessingRecord) {
      return {
        status: 'error',
        code: 404,
        message: 'Visa processing record not found'
      };
    }

    // Delete all related payment records first to avoid foreign key constraint violation
    const deletedPayments = await db
      .deleteFrom('visa_processing_payments')
      .where('visa_processing_id', '=', id)
      .execute();

    console.log(`Deleted ${deletedPayments.length || 0} related payment records for visa processing ID: ${id}`);

    // Now delete the main visa processing record
    const deletedVisaProcessing = await db
      .deleteFrom('visa_processing')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    return {
      status: 'success',
      code: 200,
      message: `Visa processing record deleted successfully${deletedPayments.length > 0 ? ` along with ${deletedPayments.length} related payment records` : ''}`
    };
  } catch (error) {
    console.error('Error in deleteVisaProcessing service:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to delete visa processing record',
      errors: error.message
    };
  }
};

export const getVisaPaymentsByProcessingId = async (visaProcessingId: number, db: any) => {
  try {
    const payments = await db
      .selectFrom('visa_processing_payments')
      .selectAll()
      .where('visa_processing_id', '=', visaProcessingId)
      .orderBy('created_at', 'asc')
      .execute();

    if (!payments || payments.length === 0) {
      return {
        status: 'success',
        code: 200,
        message: 'No payments found for this visa processing record',
        payments: [],
      };
    }

    return {
      status: 'success',
      code: 200,
      message: 'Visa processing payment history fetched successfully',
      payments,
    };
  } catch (error) {
    console.error('Error fetching payments:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch payments',
      errors: error.message,
    };
  }
};