import { incrementEntryCounts } from "../counters";
import { archiveRecord } from '../archive';

const formatDateForDB = (dateStr: string | null | undefined): string | null => {
  if (!dateStr || dateStr.trim() === "") return null;
  return dateStr;
};

export const createNavtcc = async (body: any, db: any) => {
  try {
    const now = new Date();
    const entryNumber = body.entry?.split("/")[0] ? parseInt(body.entry.split("/")[0]) : null;

    const newNavtcc = await db
      .insertInto("navtcc")
      .values({
        employee_name: body.employee_name,
        customer_add: body.customer_add,
        entry: body.entry,
        reference: body.reference,
        profession_key: body.profession_key,
        booking_date: formatDateForDB(body.booking_date),
        remaining_date: formatDateForDB(body.remaining_date),
        passport_detail: body.passport_detail,
        receivable_amount: parseFloat(body.receivable_amount) || 0,
        paid_cash: parseFloat(body.paid_cash) || 0,
        paid_from_bank: body.paid_from_bank || null,
        paid_in_bank: parseFloat(body.paid_in_bank) || 0,
        payed_to_bank: parseFloat(body.payed_to_bank) || 0,
        profit: parseFloat(body.profit) || 0,
        remaining_amount: parseFloat(body.remaining_amount) || 0,
        initial_paid_cash: parseFloat(body.paid_cash) || 0,
        initial_paid_in_bank: parseFloat(body.paid_in_bank) || 0,
        initial_remaining_amount: parseFloat(body.receivable_amount) - (parseFloat(body.paid_cash) || 0) - (parseFloat(body.paid_in_bank) || 0),
        vendors: body.vendors || null,
        agent_name: body.agent_name || null,
        pay_from_bank_card: body.pay_from_bank_card || null,
        card_amount: body.card_amount || 0,
        created_at: now,
        updated_at: now,
      })
      .returningAll()
      .executeTakeFirst();

    if (newNavtcc && entryNumber) {
      await incrementEntryCounts("navtcc", entryNumber, db);
    }

    return {
      status: "success",
      code: 201,
      message: "NAVTCC created successfully",
      data: newNavtcc,
    };
  } catch (error: any) {
    console.error("Error in createNavtcc:", error);
    return {
      status: "error",
      code: 500,
      message: "Failed to create NAVTCC record",
      errors: error.message,
    };
  }
};

export const updateNavtcc = async (id: number, body: any, db: any) => {
  try {
    const now = new Date();

    const currentNavtcc = await db
      .selectFrom('navtcc')
      .select(['initial_paid_cash', 'initial_paid_in_bank', 'initial_remaining_amount'])
      .where('id', '=', id)
      .executeTakeFirst();

    const updatedNavtcc = await db
      .updateTable("navtcc")
      .set({
        employee_name: body.employee_name,
        customer_add: body.customer_add,
        entry: body.entry,
        reference: body.reference,
        profession_key: body.profession_key,
        booking_date: formatDateForDB(body.booking_date),
        remaining_date: formatDateForDB(body.remaining_date),
        passport_detail: body.passport_detail,
        receivable_amount: parseFloat(body.receivable_amount) || 0,
        paid_cash: parseFloat(body.paid_cash) || 0,
        paid_from_bank: body.paid_from_bank || null,
        paid_in_bank: parseFloat(body.paid_in_bank) || 0,
        payed_to_bank: parseFloat(body.payed_to_bank) || 0,
        profit: parseFloat(body.profit) || 0,
        remaining_amount: parseFloat(body.remaining_amount) || 0,
        initial_paid_cash: currentNavtcc?.initial_paid_cash || parseFloat(body.paid_cash) || 0,
        initial_paid_in_bank: currentNavtcc?.initial_paid_in_bank || parseFloat(body.paid_in_bank) || 0,
        initial_remaining_amount: currentNavtcc?.initial_remaining_amount || (parseFloat(body.receivable_amount) - (parseFloat(body.paid_cash) || 0) - (parseFloat(body.paid_in_bank) || 0)),
        vendors: body.vendors || null,
        agent_name: body.agent_name || null,
        pay_from_bank_card: body.pay_from_bank_card || null,
        card_amount: body.card_amount || 0,
        updated_at: now,
      })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();

    if (!updatedNavtcc) {
      return {
        status: "error",
        code: 404,
        message: "NAVTCC record not found",
      };
    }

    return {
      status: "success",
      code: 200,
      message: "NAVTCC updated successfully",
      data: updatedNavtcc,
    };
  } catch (error: any) {
    console.error("Error in updateNavtcc:", error);
    return {
      status: "error",
      code: 500,
      message: "Failed to update NAVTCC record",
      errors: error.message,
    };
  }
};

export const createNavtccPayment = async (body: any, db: any) => {
  try {
    const now = new Date();

    const currentNavtcc = await db
      .selectFrom('navtcc')
      .select(['remaining_amount', 'paid_cash', 'paid_in_bank'])
      .where('id', '=', body.navtcc_id)
      .executeTakeFirst();

    if (!currentNavtcc) {
      return {
        status: 'error',
        code: 404,
        message: 'NAVTCC record not found for payment update',
      };
    }

    const amountPaidCash = parseFloat(body.payed_cash) || 0;
    const amountPaidBank = parseFloat(body.paid_bank) || 0;
    const totalPaymentAmount = amountPaidCash + amountPaidBank;

    const currentRemaining = parseFloat(currentNavtcc.remaining_amount) || 0;
    const currentPaidCash = parseFloat(currentNavtcc.paid_cash) || 0;
    const currentPaidInBank = parseFloat(currentNavtcc.paid_in_bank) || 0;

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
      .insertInto('navtcc_payments')
      .values({
        navtcc_id: body.navtcc_id,
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

    const updatedNavtcc = await db
      .updateTable('navtcc')
      .set({
        remaining_amount: newRemainingAmount,
        paid_cash: newPaidCash,
        paid_in_bank: newPaidInBank,
        updated_at: now
      })
      .where('id', '=', body.navtcc_id)
      .returningAll()
      .executeTakeFirst();

    return {
      status: 'success',
      code: 201,
      message: 'Payment recorded and NAVTCC amounts updated successfully',
      payment: newPayment,
      navtcc: updatedNavtcc,
    };
  } catch (error: any) {
    console.error('Error in createNavtccPayment service:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to record payment or update NAVTCC record',
      errors: error.message,
    };
  }
};

export const getNavtccPaymentsByNavtccId = async (navtccId: number, db: any) => {
  try {
    const payments = await db
      .selectFrom('navtcc_payments')
      .selectAll()
      .where('navtcc_id', '=', navtccId)
      .orderBy('created_at', 'asc')
      .execute();

    if (!payments || payments.length === 0) {
      return {
        status: 'success',
        code: 200,
        message: 'No payments found for this NAVTCC record',
        payments: [],
      };
    }

    return {
      status: 'success',
      code: 200,
      message: 'NAVTCC payment history fetched successfully',
      payments,
    };
  } catch (error: any) {
    console.error('Error fetching NAVTCC payments:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch payments',
      errors: error.message,
    };
  }
};

export const updateNavtccPayment = async (paymentId: number, body: any, db: any) => {
  try {
    const currentPayment = await db
      .selectFrom('navtcc_payments')
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

    const currentNavtcc = await db
      .selectFrom('navtcc')
      .select(['remaining_amount', 'paid_cash', 'paid_in_bank'])
      .where('id', '=', currentPayment.navtcc_id)
      .executeTakeFirst();

    if (!currentNavtcc) {
      return {
        status: 'error',
        code: 404,
        message: 'NAVTCC record not found',
      };
    }

    const newRemainingAmount = parseFloat(currentNavtcc.remaining_amount) - totalDifference;
    const newPaidCash = parseFloat(currentNavtcc.paid_cash) + cashDifference;
    const newPaidInBank = parseFloat(currentNavtcc.paid_in_bank) + bankDifference;

    const updatedPayment = await db
      .updateTable('navtcc_payments')
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
      .updateTable('navtcc')
      .set({
        remaining_amount: newRemainingAmount,
        paid_cash: newPaidCash,
        paid_in_bank: newPaidInBank,
      })
      .where('id', '=', currentPayment.navtcc_id)
      .execute();

    return {
      status: 'success',
      code: 200,
      message: 'Payment updated successfully',
      payment: updatedPayment,
    };
  } catch (error: any) {
    console.error('Error in updateNavtccPayment service:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to update payment',
      errors: error.message,
    };
  }
};

export const deleteNavtccPayment = async (paymentId: number, db: any) => {
  try {
    const paymentRecord = await db
      .selectFrom('navtcc_payments')
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

    const currentNavtcc = await db
      .selectFrom('navtcc')
      .select(['remaining_amount', 'paid_cash', 'paid_in_bank'])
      .where('id', '=', paymentRecord.navtcc_id)
      .executeTakeFirst();

    if (!currentNavtcc) {
      return {
        status: 'error',
        code: 404,
        message: 'NAVTCC record not found',
      };
    }

    const newRemainingAmount = parseFloat(currentNavtcc.remaining_amount) + cashAmount + bankAmount;
    const newPaidCash = parseFloat(currentNavtcc.paid_cash) - cashAmount;
    const newPaidInBank = parseFloat(currentNavtcc.paid_in_bank) - bankAmount;

    const deletedPayment = await db
      .deleteFrom('navtcc_payments')
      .where('id', '=', paymentId)
      .returningAll()
      .executeTakeFirst();

    await db
      .updateTable('navtcc')
      .set({
        remaining_amount: newRemainingAmount,
        paid_cash: newPaidCash,
        paid_in_bank: newPaidInBank,
      })
      .where('id', '=', paymentRecord.navtcc_id)
      .execute();

    return {
      status: 'success',
      code: 200,
      message: 'Payment deleted successfully and NAVTCC amounts updated',
      payment: deletedPayment,
    };
  } catch (error: any) {
    console.error('Error in deleteNavtccPayment service:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to delete payment',
      errors: error.message,
    };
  }
};

export const deleteNavtcc = async (id: number, db: any, deletedBy: string = 'system') => {
  try {
    const record = await db
      .selectFrom('navtcc')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!record) {
      return { status: 'error', code: 404, message: 'NAVTCC record not found' };
    }

    // Get related payments
    const payments = await db
      .selectFrom('navtcc_payments')
      .selectAll()
      .where('navtcc_id', '=', id)
      .execute();

    // Archive NAVTCC with related payments
    const archiveResult = await archiveRecord('navtcc', id, {
      navtcc: record,
      payments: payments
    }, db, deletedBy);

    if (archiveResult.status !== 'success') {
      return { status: 'error', code: 500, message: 'Failed to archive NAVTCC record', errors: archiveResult.message };
    }

    // Delete related payments first
    const deletedPayments = await db
      .deleteFrom('navtcc_payments')
      .where('navtcc_id', '=', id)
      .execute();

    console.log(`Deleted ${deletedPayments.length || 0} related payment records for NAVTCC ID: ${id}`);

    // Delete the main record
    const deleted = await db
      .deleteFrom('navtcc')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    return {
      status: 'success',
      code: 200,
      message: `NAVTCC record archived and deleted successfully${deletedPayments.length > 0 ? ` along with ${deletedPayments.length} related payment records` : ''}`,
      data: deleted,
    };
  } catch (error: any) {
    console.error('Error in deleteNavtcc:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to delete NAVTCC record',
      errors: error.message,
    };
  }
};