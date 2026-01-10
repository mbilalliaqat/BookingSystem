import { incrementEntryCounts } from "../counters";
import { archiveRecord } from '../archive';

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
        professional: body.professional,
        embassy_send_date: formatDateForDB(body.embassy_send_date),
        embassy_return_date: formatDateForDB(body.embassy_return_date),
        protector_date: formatDateForDB(body.protector_date),
        expiry_medical_date: formatDateForDB(body.expiry_medical_date),
        passport_deliver_date: formatDateForDB(body.passport_deliver_date),
        receivable_amount: body.receivable_amount,
        additional_charges: body.additional_charges,
        pay_for_protector: body.pay_for_protector,
        paid_cash: body.paid_cash || 0,
        paid_in_bank: body.paid_in_bank || 0,
        profit: body.profit || 0,
        remaining_amount: body.remaining_amount || 0,
        initial_paid_cash: body.paid_cash || 0,
        initial_paid_in_bank: body.paid_in_bank || 0,
        initial_remaining_amount: body.receivable_amount - (body.paid_cash || 0) - (body.paid_in_bank || 0),
        status: body.status || 'Processing',
        agent_name: body.agent_name || null,
        vendor_name: body.vendor_name || null,
        payable_to_vendor: body.payable_to_vendor || 0,
        booking_date: formatDateForDB(body.booking_date),
        remaining_date: formatDateForDB(body.remaining_date),
        detail: body.detail || null,
        mobile_no: body.mobile_no || null,
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
      errors: (error as any).message
    };
  }
};

export const updateVisaProcessing = async (id: number, body: any, db: any) => {
  try {
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
        professional: body.professional,
        embassy_send_date: formatDateForDB(body.embassy_send_date),
        embassy_return_date: formatDateForDB(body.embassy_return_date),
        protector_date: formatDateForDB(body.protector_date),
        expiry_medical_date: formatDateForDB(body.expiry_medical_date),
        passport_deliver_date: formatDateForDB(body.passport_deliver_date),
        receivable_amount: body.receivable_amount,
        additional_charges: body.additional_charges,
        pay_for_protector: body.pay_for_protector,
        paid_cash: body.paid_cash || 0,
        paid_in_bank: body.paid_in_bank || 0,
        profit: body.profit || 0,
        remaining_amount: body.remaining_amount || 0,
        initial_paid_cash: currentVisaProcessing?.initial_paid_cash || body.paid_cash || 0,
        initial_paid_in_bank: currentVisaProcessing?.initial_paid_in_bank || body.paid_in_bank || 0,
        initial_remaining_amount: currentVisaProcessing?.initial_remaining_amount || (body.receivable_amount - (body.paid_cash || 0) - (body.paid_in_bank || 0)),
        status: body.status || 'Processing',
        agent_name: body.agent_name || null,
        vendor_name: body.vendor_name || null,
        payable_to_vendor: body.payable_to_vendor || 0,
        detail: body.detail,
        booking_date: formatDateForDB(body.booking_date),
        remaining_date: formatDateForDB(body.remaining_date),
        mobile_no: body.mobile_no || null,
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
      errors: (error as any).message
    };
  }
};

export const createVisaPayment = async (body: any, db: any) => {
  try {
    const now = new Date();

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

    const amountPaidCash = parseFloat(body.payed_cash) || 0;
    const amountPaidBank = parseFloat(body.paid_bank) || 0;
    const totalPaymentAmount = amountPaidCash + amountPaidBank;

    const currentRemaining = parseFloat(currentVisaProcessing.remaining_amount) || 0;
    const currentPaidCash = parseFloat(currentVisaProcessing.paid_cash) || 0;
    const currentPaidInBank = parseFloat(currentVisaProcessing.paid_in_bank) || 0;

    const newRemainingAmount = Math.max(0, currentRemaining - totalPaymentAmount);
    const newPaidCash = currentPaidCash + amountPaidCash;
    const newPaidInBank = currentPaidInBank + amountPaidBank;

    if (totalPaymentAmount > currentRemaining) {
      return {
        status: 'error',
        code: 400,
        message: `Payment amount (${totalPaymentAmount}) exceeds remaining amount (${currentRemaining})`,
      };
    }

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
        remaining_amount: newRemainingAmount.toString(),
      })
      .returningAll()
      .executeTakeFirst();

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
      errors: (error as any).message,
    };
  }
};

export const deleteVisaProcessing = async (id: number, db: any, deletedBy: string = 'system') => {
  try {
    // 1. Get the visa processing record
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

    // 2. Get all payments for this visa processing
    const payments = await db
      .selectFrom('visa_processing_payments')
      .selectAll()
      .where('visa_processing_id', '=', id)
      .execute();

    // 3. Archive visa processing with related payments
    const archiveResult = await archiveRecord('visa_processing', id, {
      visa_processing: visaProcessingRecord,
      payments: payments
    }, db, deletedBy);

    if (archiveResult.status !== 'success') {
      console.error('Failed to archive visa processing:', archiveResult.message);
    }

    // 4. Delete related Agent records - ONLY by exact entry match
    const relatedAgents = await db
      .selectFrom('agent')
      .select('id')
      .where('entry', '=', visaProcessingRecord.entry)  // EXACT match only
      .execute();

    console.log(`Found ${relatedAgents.length} related agent records for visa processing ${id} (entry: ${visaProcessingRecord.entry})`);

    // Delete each agent record
    for (const agent of relatedAgents) {
      const { deleteAgent } = await import('../agent/index');
      await deleteAgent(agent.id, db, deletedBy);
    }

    // 5. Delete related Vendor records - ONLY by exact entry match
    const relatedVendors = await db
      .selectFrom('vender')
      .select('id')
      .where('entry', '=', visaProcessingRecord.entry)  // EXACT match only
      .execute();

    console.log(`Found ${relatedVendors.length} related vendor records for visa processing ${id} (entry: ${visaProcessingRecord.entry})`);

    for (const vendor of relatedVendors) {
      const { deleteVendor } = await import('../vender/index');
      await deleteVendor(vendor.id, db, deletedBy);
    }

    // 6. Delete related Office Account records - ONLY by exact entry match
    const relatedAccounts = await db
      .selectFrom('office_accounts')
      .select('id')
      .where('entry', '=', visaProcessingRecord.entry)  // EXACT match only
      .execute();

    console.log(`Found ${relatedAccounts.length} related office account records for visa processing ${id} (entry: ${visaProcessingRecord.entry})`);

    for (const account of relatedAccounts) {
      const { deleteEntry } = await import('../accountsRecord/index');
      await deleteEntry(account.id, db, deletedBy);
    }

    // 7. Delete all payments for this visa processing
    if (payments.length > 0) {
      await db
        .deleteFrom('visa_processing_payments')
        .where('visa_processing_id', '=', id)
        .execute();
      console.log(`Deleted ${payments.length} payment records for visa processing ${id}`);
    }

    // 8. Delete the visa processing record
    await db
      .deleteFrom('visa_processing')
      .where('id', '=', id)
      .execute();

    return {
      status: 'success',
      code: 200,
      message: `Visa processing record and all related records deleted successfully (${relatedAgents.length} agent records, ${relatedVendors.length} vendor records, ${relatedAccounts.length} account records, ${payments.length} payments)`,
      deletedRecords: {
        agents: relatedAgents.length,
        vendors: relatedVendors.length,
        accounts: relatedAccounts.length,
        payments: payments.length
      }
    };
  } catch (error) {
    console.error('Error in deleteVisaProcessing service:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to delete visa processing record and related records',
      errors: (error as any).message
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
      errors: (error as any).message,
    };
  }
};

export const updateVisaPayment = async (paymentId: number, body: any, db: any) => {
  try {
    const currentPayment = await db
      .selectFrom('visa_processing_payments')
      .selectAll()
      .where('id', '=', paymentId)
      .executeTakeFirst();

    if (!currentPayment) {
      return {
        status: 'error',
        code: 404,
        message: 'Payment not found',
      };
    }

    const oldCashAmount = parseFloat(currentPayment.payed_cash) || 0;
    const oldBankAmount = parseFloat(currentPayment.paid_bank) || 0;
    const newCashAmount = parseFloat(body.payed_cash) || 0;
    const newBankAmount = parseFloat(body.paid_bank) || 0;

    const cashDifference = newCashAmount - oldCashAmount;
    const bankDifference = newBankAmount - oldBankAmount;
    const totalDifference = cashDifference + bankDifference;

    const currentVisaProcessing = await db
      .selectFrom('visa_processing')
      .select(['remaining_amount', 'paid_cash', 'paid_in_bank'])
      .where('id', '=', currentPayment.visa_processing_id)
      .executeTakeFirst();

    if (!currentVisaProcessing) {
      return {
        status: 'error',
        code: 404,
        message: 'Visa processing record not found',
      };
    }

    const newRemainingAmount = parseFloat(currentVisaProcessing.remaining_amount) - totalDifference;
    const newPaidCash = parseFloat(currentVisaProcessing.paid_cash) + cashDifference;
    const newPaidInBank = parseFloat(currentVisaProcessing.paid_in_bank) + bankDifference;

    const updatedPayment = await db
      .updateTable('visa_processing_payments')
      .set({
        payment_date: formatDateForDB(body.payment_date),
        payed_cash: newCashAmount.toString(),
        paid_bank: newBankAmount.toString(),
        bank_title: body.bank_title || null,
        recorded_by: body.recorded_by,
        remaining_amount: newRemainingAmount.toString(),
      })
      .where('id', '=', paymentId)
      .returningAll()
      .executeTakeFirst();

    await db
      .updateTable('visa_processing')
      .set({
        remaining_amount: newRemainingAmount,
        paid_cash: newPaidCash,
        paid_in_bank: newPaidInBank,
      })
      .where('id', '=', currentPayment.visa_processing_id)
      .execute();

    return {
      status: 'success',
      code: 200,
      message: 'Payment updated successfully',
      payment: updatedPayment,
    };
  } catch (error) {
    console.error('Error in updateVisaPayment service:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to update payment',
      errors: (error as any).message,
    };
  }
};

export const deleteVisaPayment = async (paymentId: number, db: any) => {
  try {
    const paymentRecord = await db
      .selectFrom('visa_processing_payments')
      .selectAll()
      .where('id', '=', paymentId)
      .executeTakeFirst();

    if (!paymentRecord) {
      return {
        status: 'error',
        code: 404,
        message: 'Payment not found',
      };
    }

    const cashAmount = parseFloat(paymentRecord.payed_cash) || 0;
    const bankAmount = parseFloat(paymentRecord.paid_bank) || 0;

    const currentVisaProcessing = await db
      .selectFrom('visa_processing')
      .select(['remaining_amount', 'paid_cash', 'paid_in_bank'])
      .where('id', '=', paymentRecord.visa_processing_id)
      .executeTakeFirst();

    if (!currentVisaProcessing) {
      return {
        status: 'error',
        code: 404,
        message: 'Visa processing record not found',
      };
    }

    const newRemainingAmount = parseFloat(currentVisaProcessing.remaining_amount) + cashAmount + bankAmount;
    const newPaidCash = parseFloat(currentVisaProcessing.paid_cash) - cashAmount;
    const newPaidInBank = parseFloat(currentVisaProcessing.paid_in_bank) - bankAmount;

    const deletedPayment = await db
      .deleteFrom('visa_processing_payments')
      .where('id', '=', paymentId)
      .returningAll()
      .executeTakeFirst();

    await db
      .updateTable('visa_processing')
      .set({
        remaining_amount: newRemainingAmount,
        paid_cash: newPaidCash,
        paid_in_bank: newPaidInBank,
      })
      .where('id', '=', paymentRecord.visa_processing_id)
      .execute();

    return {
      status: 'success',
      code: 200,
      message: 'Payment deleted successfully and visa processing amounts updated',
      payment: deletedPayment,
    };
  } catch (error) {
    console.error('Error in deleteVisaPayment service:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to delete payment',
      errors: (error as any).message,
    };
  }
};