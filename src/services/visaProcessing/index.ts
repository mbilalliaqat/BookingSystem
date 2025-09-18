import { incrementEntryCounts } from "../counters";

// Updated service functions for your visa processing index.ts file
// Replace your existing functions with these updated versions

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
        embassy_send_date: body.embassy_send_date,
        embassy_return_date: body.embassy_return_date,
        protector_date: body.protector_date,
        passport_deliver_date: body.passport_deliver_date,
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
        embassy_send_date: body.embassy_send_date,
        embassy_return_date: body.embassy_return_date,
        protector_date: body.protector_date,
        passport_deliver_date: body.passport_deliver_date,
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

// Your existing createVisaPayment function is already correct, but here's the updated version
// to ensure it doesn't modify initial values
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

    const amountPaidCash = parseFloat(body.payment_amount) || 0;
    const amountPaidBank = parseFloat(body.paid_bank) || 0;

    const currentRemaining = parseFloat(currentVisaProcessing.remaining_amount) || 0;
    const currentPaidCash = parseFloat(currentVisaProcessing.paid_cash) || 0;
    const currentPaidInBank = parseFloat(currentVisaProcessing.paid_in_bank) || 0;

    const newRemainingAmount = currentRemaining - (amountPaidCash + amountPaidBank);
    const newPaidCash = currentPaidCash + amountPaidCash;
    const newPaidInBank = currentPaidInBank + amountPaidBank;

    // Insert payment record
    const newPayment = await db
      .insertInto('visa_processing_payments')
      .values({
        visa_processing_id: body.visa_processing_id,
        payment_date: formatDateForDB(body.payment_date) || now.toISOString().split('T')[0],
        payed_cash: amountPaidCash.toString(),
        paid_bank: amountPaidBank.toString(),
        bank_title: body.bank_title || null,
        recorded_by: body.recorded_by,
        created_at: now,
        remaining_amount: newRemainingAmount,
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
        // DON'T update initial values here
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
  
  export const deleteVisaProcessing = async (id: number, db: any) => {
    try {
      const deletedVisaProcessing = await db
        .deleteFrom('visa_processing')
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
  
      if (!deletedVisaProcessing) {
        return {
          status: 'error',
          code: 404,
          message: 'Visa processing record not found'
        };
      }
  
      return {
        status: 'success',
        code: 200,
        message: 'Visa processing record deleted successfully'
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
      message: 'Visa processing payment history fetched successfully', // Added missing message
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
  