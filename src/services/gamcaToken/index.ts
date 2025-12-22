import { incrementEntryCounts } from "../counters";

import { incrementEntryCounts } from '../counters';
import { archiveRecord } from '../archive';

const formatDateForDB = (dateStr: string | null | undefined): string | null => {
  if (!dateStr || dateStr.trim() === '') {
    return null;
  }
  return dateStr;
};

export const createGamcaTokenPayment = async (body: any, db: any) => {
  try {
    const now = new Date();

    // Get current GAMCA token data
    const currentGamcaToken = await db
      .selectFrom('gamca_token')
      .select(['remaining_amount', 'paid_cash', 'paid_in_bank'])
      .where('id', '=', body.gamca_token_id)
      .executeTakeFirst();

    if (!currentGamcaToken) {
      return {
        status: 'error',
        code: 404,
        message: 'GAMCA token record not found for payment update',
      };
    }

    const amountPaidCash = parseFloat(body.paid_cash) || 0;
    const amountPaidBank = parseFloat(body.paid_in_bank) || 0;

    const currentRemaining = parseFloat(currentGamcaToken.remaining_amount) || 0;
    const currentPaidCash = parseFloat(currentGamcaToken.paid_cash) || 0;
    const currentPaidInBank = parseFloat(currentGamcaToken.paid_in_bank) || 0;

    const newRemainingAmount = currentRemaining - (amountPaidCash + amountPaidBank);
    const newPaidCash = currentPaidCash + amountPaidCash;
    const newPaidInBank = currentPaidInBank + amountPaidBank;

    // Insert payment record
    const newPayment = await db
      .insertInto('gamca_token_payments')
      .values({
        gamca_token_id: body.gamca_token_id,
        payment_date: formatDateForDB(body.payment_date) || now.toISOString().split('T')[0],
        paid_cash: amountPaidCash,
        paid_in_bank: amountPaidBank,
        bank_title: body.bank_title || null,
        recorded_by: body.recorded_by,
        created_at: now,
        remaining_amount: newRemainingAmount,
      })
      .returningAll()
      .executeTakeFirst();

    // Update main gamca_token record
    await db
      .updateTable('gamca_token')
      .set({
        remaining_amount: newRemainingAmount,
        paid_cash: newPaidCash,
        paid_in_bank: newPaidInBank,
        updated_at: now,
      })
      .where('id', '=', body.gamca_token_id)
      .execute();

    return {
      status: 'success',
      code: 201,
      message: 'Payment recorded and GAMCA token updated successfully',
      payment: newPayment,
    };
  } catch (error: any) {
    console.error('Error in createGamcaTokenPayment:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to record payment',
      errors: error.message,
    };
  }
};

export const getGamcaTokenPaymentsByTokenId = async (gamcaTokenId: number, db: any) => {
  try {
    const payments = await db
      .selectFrom('gamca_token_payments')
      .selectAll()
      .where('gamca_token_id', '=', gamcaTokenId)
      .orderBy('created_at', 'desc')
      .execute();

    return {
      status: 'success',
      code: 200,
      message: payments.length > 0 ? 'Payments fetched' : 'No payments found',
      payments,
    };
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch payment history',
      errors: error.message,
    };
  }
};

export const updateGamcaTokenPayment = async (paymentId: number, body: any, db: any) => {
  try {
    const currentPayment = await db
      .selectFrom('gamca_token_payments')
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

    const oldCash = parseFloat(currentPayment.paid_cash) || 0;
    const oldBank = parseFloat(currentPayment.paid_in_bank) || 0;
    const newCash = parseFloat(body.paid_cash) || 0;
    const newBank = parseFloat(body.paid_in_bank) || 0;

    const cashDiff = newCash - oldCash;
    const bankDiff = newBank - oldBank;
    const totalDiff = cashDiff + bankDiff;

    const currentToken = await db
      .selectFrom('gamca_token')
      .select(['remaining_amount', 'paid_cash', 'paid_in_bank'])
      .where('id', '=', currentPayment.gamca_token_id)
      .executeTakeFirst();

    if (!currentToken) {
      return {
        status: 'error',
        code: 404,
        message: 'GAMCA token not found',
      };
    }

    const newRemaining = parseFloat(currentToken.remaining_amount) - totalDiff;
    const newPaidCash = parseFloat(currentToken.paid_cash) + cashDiff;
    const newPaidInBank = parseFloat(currentToken.paid_in_bank) + bankDiff;

    const updatedPayment = await db
      .updateTable('gamca_token_payments')
      .set({
        payment_date: formatDateForDB(body.payment_date),
        paid_cash: newCash,
        paid_in_bank: newBank,
        bank_title: body.bank_title || null,
        recorded_by: body.recorded_by,
        remaining_amount: newRemaining,
      })
      .where('id', '=', paymentId)
      .returningAll()
      .executeTakeFirst();

    await db
      .updateTable('gamca_token')
      .set({
        remaining_amount: newRemaining,
        paid_cash: newPaidCash,
        paid_in_bank: newPaidInBank,
        updated_at: new Date(),
      })
      .where('id', '=', currentPayment.gamca_token_id)
      .execute();

    return {
      status: 'success',
      code: 200,
      message: 'Payment updated successfully',
      payment: updatedPayment,
    };
  } catch (error: any) {
    console.error('Error in updateGamcaTokenPayment:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to update payment',
      errors: error.message,
    };
  }
};

export const deleteGamcaTokenPayment = async (paymentId: number, db: any) => {
  try {
    const paymentRecord = await db
      .selectFrom('gamca_token_payments')
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

    const cashAmount = parseFloat(paymentRecord.paid_cash) || 0;
    const bankAmount = parseFloat(paymentRecord.paid_in_bank) || 0;

    const currentToken = await db
      .selectFrom('gamca_token')
      .select(['remaining_amount', 'paid_cash', 'paid_in_bank'])
      .where('id', '=', paymentRecord.gamca_token_id)
      .executeTakeFirst();

    if (!currentToken) {
      return {
        status: 'error',
        code: 404,
        message: 'GAMCA token not found',
      };
    }

    const newRemaining = parseFloat(currentToken.remaining_amount) + cashAmount + bankAmount;
    const newPaidCash = parseFloat(currentToken.paid_cash) - cashAmount;
    const newPaidInBank = parseFloat(currentToken.paid_in_bank) - bankAmount;

    const deletedPayment = await db
      .deleteFrom('gamca_token_payments')
      .where('id', '=', paymentId)
      .returningAll()
      .executeTakeFirst();

    await db
      .updateTable('gamca_token')
      .set({
        remaining_amount: newRemaining,
        paid_cash: newPaidCash,
        paid_in_bank: newPaidInBank,
        updated_at: new Date(),
      })
      .where('id', '=', paymentRecord.gamca_token_id)
      .execute();

    return {
      status: 'success',
      code: 200,
      message: 'Payment deleted successfully and GAMCA token updated',
      payment: deletedPayment,
    };
  } catch (error: any) {
    console.error('Error in deleteGamcaTokenPayment:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to delete payment',
      errors: error.message,
    };
  }
};

export const createGamcaToken = async (body: any, db: any) => {
  try {
    const now = new Date();
    // Extract number after space and before slash: "GM 1/3" -> 1
    const entryMatch = body.entry.match(/(\d+)\/\d+/);
    const currentEntryNumber = entryMatch ? parseInt(entryMatch[1]) : null;

    

    const newGamcaToken = await db
      .insertInto('gamca_token')
      .values({
        employee_name: body.employee_name,
        customer_add: body.customer_add,
        entry: body.entry,
        reference: body.reference,
        country: body.country,
        booking_date: formatDateForDB(body.booking_date),
        remaining_date: formatDateForDB(body.remaining_date),
        passport_detail: body.passport_detail,
        receivable_amount: body.receivable_amount,
        paid_cash: body.paid_cash || 0,
        paid_from_bank: body.paid_from_bank || null,
        paid_in_bank: body.paid_in_bank || 0,
        payable_to_vendor: body.payable_to_vendor || 0,
        vendor_name: body.vendor_name || null,
        vendors_detail: body.vendors_detail ? JSON.stringify(body.vendors_detail) : null,
        agent_name: body.agent_name || null,
        profit: body.profit || 0,
        remaining_amount: body.remaining_amount || body.receivable_amount || 0,
        initial_paid_cash: body.paid_cash || 0,
        initial_paid_in_bank: body.paid_in_bank || 0,
        initial_remaining_amount: body.receivable_amount - (body.paid_cash || 0) - (body.paid_in_bank || 0),

        created_at: now,
        updated_at: now,
      })
      .returningAll()
      .executeTakeFirst();

    

   if (newGamcaToken && currentEntryNumber) {
  console.log('Calling incrementEntryCounts for GAMCA');
  await incrementEntryCounts('gamca', currentEntryNumber, db); // Use 'gamca' not 'gamca_token'
}
    return {
      status: 'success',
      code: 201,
      message: 'GAMCA token created successfully',
      data: newGamcaToken,
    };
  } catch (error: any) {
    console.error('Error in createGamcaToken:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to create GAMCA token',
      errors: error.message,
    };
  }
};

export const updateGamcaToken = async (id: number, body: any, db: any) => {
  try {
    const now = new Date();

    // Fetch current record to preserve initial payments
    const current = await db
      .selectFrom('gamca_token')
      .select(['initial_paid_cash', 'initial_paid_in_bank'])
      .where('id', '=', id)
      .executeTakeFirst();

    if (!current) {
      return {
        status: 'error',
        code: 404,
        message: 'GAMCA token not found',
      };
    }

    const updatedGamcaToken = await db
      .updateTable('gamca_token')
      .set({
        employee_name: body.employee_name,
        customer_add: body.customer_add,
        entry: body.entry,
        reference: body.reference,
        country: body.country,
        booking_date: formatDateForDB(body.booking_date),
        remaining_date: formatDateForDB(body.remaining_date),
        passport_detail: body.passport_detail,
        receivable_amount: body.receivable_amount,
        paid_cash: body.paid_cash || 0,
        paid_from_bank: body.paid_from_bank || null,
        paid_in_bank: body.paid_in_bank || 0,
        payable_to_vendor: body.payable_to_vendor || 0,
        vendor_name: body.vendor_name || null,
        vendors_detail: body.vendors_detail ? JSON.stringify(body.vendors_detail) : null,
        agent_name: body.agent_name || null,
        profit: body.profit || 0,
        remaining_amount: body.remaining_amount || 0,
        // Preserve initial paid amounts (only set once on create)
        initial_paid_cash: current.initial_paid_cash ?? (body.paid_cash || 0),
        initial_paid_in_bank: current.initial_paid_in_bank ?? (body.paid_in_bank || 0),
        initial_remaining_amount: current?.initial_remaining_amount || (body.receivable_amount - (body.paid_cash || 0) - (body.paid_in_bank || 0)),
        updated_at: now,
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!updatedGamcaToken) {
      return {
        status: 'error',
        code: 404,
        message: 'GAMCA token not found',
      };
    }

    return {
      status: 'success',
      code: 200,
      message: 'GAMCA token updated successfully',
      data: updatedGamcaToken,
    };
  } catch (error: any) {
    console.error('Error in updateGamcaToken:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to update GAMCA token',
      errors: error.message,
    };
  }
};

export const deleteGamcaToken = async (id: number, db: any, deletedBy: string = 'system') => {
  try {
    // 1. Get gamca token data
    const tokenRecord = await db
      .selectFrom('gamca_token')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!tokenRecord) {
      return { status: 'error', code: 404, message: 'GAMCA token not found' };
    }

    // 2. Get related payments
    const payments = await db
      .selectFrom('gamca_token_payments')
      .selectAll()
      .where('gamca_token_id', '=', id)
      .execute();

    // 3. Archive token with related data
    const archiveResult = await archiveRecord('gamca_token', id, { token: tokenRecord, payments }, db, deletedBy);

    if (archiveResult.status !== 'success') {
      return { status: 'error', code: 500, message: 'Failed to archive GAMCA token', errors: archiveResult.message };
    }

    // 4. Delete payments
    await db
      .deleteFrom('gamca_token_payments')
      .where('gamca_token_id', '=', id)
      .execute();

    // 5. Delete token
    const deleted = await db
      .deleteFrom('gamca_token')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    return {
      status: 'success',
      code: 200,
      message: 'GAMCA token archived and deleted successfully',
      data: deleted,
    };
  } catch (error: any) {
    console.error('Error deleting GAMCA token:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to delete GAMCA token',
      errors: error.message,
    };
  }
};