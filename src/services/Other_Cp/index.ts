import { incrementEntryCounts } from '../counters';
import { archiveRecord } from '../archive';

const formatDateForDB = (dateStr: string | null | undefined): string | null => {
  if (!dateStr || dateStr.trim() === '') {
    return null;
  }
  return dateStr;
};

export const createOtherCp = async (body: any, db: any) => {
  try {
    const now = new Date();
    // Extract both numbers from entry: "OCP 1/75" -> currentNum=1, globalNum=75
    const entryMatch = body.entry.match(/(\d+)\/(\d+)/);
    const currentEntryNumber = entryMatch ? parseInt(entryMatch[1]) : null;
    const globalEntryNumber = entryMatch ? parseInt(entryMatch[2]) : null;

    const newOtherCp = await db
      .insertInto('other_cp')
      .values({
        date: formatDateForDB(body.date) || now.toISOString().split('T')[0],
        entry: body.entry,
        employee: body.employee,
        detail: body.detail,
        card_payment: body.card_payment,
        card_amount: body.card_amount || 0,
        receivable_amount: body.receivable_amount || 0,
        paid_cash: body.paid_cash || 0,
        paid_from_bank: body.paid_from_bank || null,
        paid_in_bank: body.paid_in_bank || 0,
        agent_name: body.agent_name || null,
        profit: body.profit || 0,
        remaining_amount: body.remaining_amount || 0,
        initial_paid_cash: body.paid_cash || 0,
        initial_paid_in_bank: body.paid_in_bank || 0,
        initial_remaining_amount: (body.receivable_amount || 0) - (body.paid_cash || 0) - (body.paid_in_bank || 0),
        created_at: now,
        updated_at: now,
      })
      .returningAll()
      .executeTakeFirst();

    if (newOtherCp && currentEntryNumber && globalEntryNumber) {
      console.log('Calling incrementEntryCounts for Other CP with global:', currentEntryNumber, globalEntryNumber);
      await incrementEntryCounts('other-cp', currentEntryNumber, globalEntryNumber, db);
    }

    return {
      status: 'success',
      code: 201,
      message: 'Other CP entry created successfully',
      data: newOtherCp,
    };
  } catch (error: any) {
    console.error('Error in createOtherCp:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to create Other CP entry',
      errors: error.message,
    };
  }
};

export const getAllOtherCp = async (db: any) => {
  try {
    const otherCpEntries = await db
      .selectFrom('other_cp')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();

    return {
      status: 'success',
      code: 200,
      message: otherCpEntries.length > 0 ? 'Other CP entries fetched successfully' : 'No Other CP entries found',
      otherCpEntries,
    };
  } catch (error: any) {
    console.error('Error in getAllOtherCp:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch Other CP entries',
      errors: error.message,
    };
  }
};

export const getOtherCpById = async (id: number, db: any) => {
  try {
    const otherCp = await db
      .selectFrom('other_cp')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!otherCp) {
      return {
        status: 'error',
        code: 404,
        message: 'Other CP entry not found',
      };
    }

    return {
      status: 'success',
      code: 200,
      message: 'Other CP entry fetched successfully',
      data: otherCp,
    };
  } catch (error: any) {
    console.error('Error in getOtherCpById:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch Other CP entry',
      errors: error.message,
    };
  }
};

export const updateOtherCp = async (id: number, body: any, db: any) => {
  try {
    const now = new Date();

    const currentOtherCp = await db
      .selectFrom('other_cp')
      .select(['initial_paid_cash', 'initial_paid_in_bank', 'initial_remaining_amount'])
      .where('id', '=', id)
      .executeTakeFirst();

    const updatedOtherCp = await db
      .updateTable('other_cp')
      .set({
        date: formatDateForDB(body.date),
        entry: body.entry,
        employee: body.employee,
        detail: body.detail,
        card_payment: body.card_payment,
        card_amount: body.card_amount || 0,
        receivable_amount: body.receivable_amount || 0,
        paid_cash: body.paid_cash || 0,
        paid_from_bank: body.paid_from_bank || null,
        paid_in_bank: body.paid_in_bank || 0,
        agent_name: body.agent_name || null,
        profit: body.profit || 0,
        remaining_amount: body.remaining_amount || 0,
        initial_paid_cash: currentOtherCp?.initial_paid_cash || body.paid_cash || 0,
        initial_paid_in_bank: currentOtherCp?.initial_paid_in_bank || body.paid_in_bank || 0,
        initial_remaining_amount: currentOtherCp?.initial_remaining_amount || ((body.receivable_amount || 0) - (body.paid_cash || 0) - (body.paid_in_bank || 0)),
        updated_at: now,
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!updatedOtherCp) {
      return {
        status: 'error',
        code: 404,
        message: 'Other CP entry not found',
      };
    }

    return {
      status: 'success',
      code: 200,
      message: 'Other CP entry updated successfully',
      data: updatedOtherCp,
    };
  } catch (error: any) {
    console.error('Error in updateOtherCp:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to update Other CP entry',
      errors: error.message,
    };
  }
};

export const createOtherCpPayment = async (body: any, db: any) => {
  try {
    const now = new Date();

    const currentOtherCp = await db
      .selectFrom('other_cp')
      .select(['remaining_amount', 'paid_cash', 'paid_in_bank'])
      .where('id', '=', body.other_cp_id)
      .executeTakeFirst();

    if (!currentOtherCp) {
      return {
        status: 'error',
        code: 404,
        message: 'Other CP record not found for payment update',
      };
    }

    const amountPaidCash = parseFloat(body.payed_cash) || 0;
    const amountPaidBank = parseFloat(body.paid_bank) || 0;
    const totalPaymentAmount = amountPaidCash + amountPaidBank;

    const currentRemaining = parseFloat(currentOtherCp.remaining_amount) || 0;
    const currentPaidCash = parseFloat(currentOtherCp.paid_cash) || 0;
    const currentPaidInBank = parseFloat(currentOtherCp.paid_in_bank) || 0;

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
      .insertInto('other_cp_payments')
      .values({
        other_cp_id: body.other_cp_id,
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

    const updatedOtherCp = await db
      .updateTable('other_cp')
      .set({
        remaining_amount: newRemainingAmount,
        paid_cash: newPaidCash,
        paid_in_bank: newPaidInBank,
        updated_at: now
      })
      .where('id', '=', body.other_cp_id)
      .returningAll()
      .executeTakeFirst();

    return {
      status: 'success',
      code: 201,
      message: 'Payment recorded and Other CP amounts updated successfully',
      payment: newPayment,
      other_cp: updatedOtherCp,
    };
  } catch (error: any) {
    console.error('Error in createOtherCpPayment service:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to record payment or update Other CP record',
      errors: error.message,
    };
  }
};

export const getOtherCpPaymentsByOtherCpId = async (otherCpId: number, db: any) => {
  try {
    const payments = await db
      .selectFrom('other_cp_payments')
      .selectAll()
      .where('other_cp_id', '=', otherCpId)
      .orderBy('created_at', 'asc')
      .execute();

    if (!payments || payments.length === 0) {
      return {
        status: 'success',
        code: 200,
        message: 'No payments found for this Other CP record',
        payments: [],
      };
    }

    return {
      status: 'success',
      code: 200,
      message: 'Other CP payment history fetched successfully',
      payments,
    };
  } catch (error: any) {
    console.error('Error fetching Other CP payments:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch payments',
      errors: error.message,
    };
  }
};

export const updateOtherCpPayment = async (paymentId: number, body: any, db: any) => {
  try {
    const currentPayment = await db
      .selectFrom('other_cp_payments')
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

    const currentOtherCp = await db
      .selectFrom('other_cp')
      .select(['remaining_amount', 'paid_cash', 'paid_in_bank'])
      .where('id', '=', currentPayment.other_cp_id)
      .executeTakeFirst();

    if (!currentOtherCp) {
      return {
        status: 'error',
        code: 404,
        message: 'Other CP record not found',
      };
    }

    const newRemainingAmount = parseFloat(currentOtherCp.remaining_amount) - totalDifference;
    const newPaidCash = parseFloat(currentOtherCp.paid_cash) + cashDifference;
    const newPaidInBank = parseFloat(currentOtherCp.paid_in_bank) + bankDifference;

    const updatedPayment = await db
      .updateTable('other_cp_payments')
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
      .updateTable('other_cp')
      .set({
        remaining_amount: newRemainingAmount,
        paid_cash: newPaidCash,
        paid_in_bank: newPaidInBank,
      })
      .where('id', '=', currentPayment.other_cp_id)
      .execute();

    return {
      status: 'success',
      code: 200,
      message: 'Payment updated successfully',
      payment: updatedPayment,
    };
  } catch (error: any) {
    console.error('Error in updateOtherCpPayment service:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to update payment',
      errors: error.message,
    };
  }
};

export const deleteOtherCpPayment = async (paymentId: number, db: any) => {
  try {
    const paymentRecord = await db
      .selectFrom('other_cp_payments')
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

    const currentOtherCp = await db
      .selectFrom('other_cp')
      .select(['remaining_amount', 'paid_cash', 'paid_in_bank'])
      .where('id', '=', paymentRecord.other_cp_id)
      .executeTakeFirst();

    if (!currentOtherCp) {
      return {
        status: 'error',
        code: 404,
        message: 'Other CP record not found',
      };
    }

    const newRemainingAmount = parseFloat(currentOtherCp.remaining_amount) + cashAmount + bankAmount;
    const newPaidCash = parseFloat(currentOtherCp.paid_cash) - cashAmount;
    const newPaidInBank = parseFloat(currentOtherCp.paid_in_bank) - bankAmount;

    const deletedPayment = await db
      .deleteFrom('other_cp_payments')
      .where('id', '=', paymentId)
      .returningAll()
      .executeTakeFirst();

    await db
      .updateTable('other_cp')
      .set({
        remaining_amount: newRemainingAmount,
        paid_cash: newPaidCash,
        paid_in_bank: newPaidInBank,
      })
      .where('id', '=', paymentRecord.other_cp_id)
      .execute();

    return {
      status: 'success',
      code: 200,
      message: 'Payment deleted successfully and Other CP amounts updated',
      payment: deletedPayment,
    };
  } catch (error: any) {
    console.error('Error in deleteOtherCpPayment service:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to delete payment',
      errors: error.message,
    };
  }
};

export const deleteOtherCp = async (id: number, db: any, deletedBy: string = 'system') => {
  try {
    // 1. Get other_cp entry data
    const otherCpRecord = await db
      .selectFrom('other_cp')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!otherCpRecord) {
      return { status: 'error', code: 404, message: 'Other CP entry not found' };
    }

    // 2. Get related payments
    const payments = await db
      .selectFrom('other_cp_payments')
      .selectAll()
      .where('other_cp_id', '=', id)
      .execute();

    // 3. Archive the entry with related payments
    const archiveResult = await archiveRecord('other_cp', id, {
      other_cp: otherCpRecord,
      payments: payments
    }, db, deletedBy);

    if (archiveResult.status !== 'success') {
      return {
        status: 'error',
        code: 500,
        message: 'Failed to archive Other CP entry',
        errors: archiveResult.message
      };
    }

    // 4. Delete related payments first
    const deletedPayments = await db
      .deleteFrom('other_cp_payments')
      .where('other_cp_id', '=', id)
      .execute();

    console.log(`Deleted ${deletedPayments.length || 0} related payment records for Other CP ID: ${id}`);

    // 5. Delete the entry
    const deleted = await db
      .deleteFrom('other_cp')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    return {
      status: 'success',
      code: 200,
      message: `Other CP entry archived and deleted successfully${deletedPayments.length > 0 ? ` along with ${deletedPayments.length} related payment records` : ''}`,
      data: deleted,
    };
  } catch (error: any) {
    console.error('Error deleting Other CP entry:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to delete Other CP entry',
      errors: error.message,
    };
  }
};