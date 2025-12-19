// Add these functions to your existing services/tickets/index.ts file or create a new services/umrah/index.ts file

// Helper function to convert empty strings to null for date fields
const formatDateForDB = (dateStr: string | null | undefined): string | null => {
  if (!dateStr || dateStr.trim() === '') {
    return null;
  }
  return dateStr;
};

export const createUmrahPayment = async (body: any, db: any) => {
  try {
    const now = new Date();

    // Get current umrah data
    const currentUmrah = await db
      .selectFrom('Umrah')
      .select(['remainingAmount', 'paidCash', 'paidInBank'])
      .where('id', '=', body.umrah_id)
      .executeTakeFirst();

    if (!currentUmrah) {
      return {
        status: 'error',
        code: 404,
        message: 'Umrah booking not found for payment update',
      };
    }

    const amountPaidCash = parseFloat(body.payment_amount) || 0;
    const amountPaidBank = parseFloat(body.paid_bank) || 0;

    const currentRemaining = parseFloat(currentUmrah.remainingAmount) || 0;
    const currentPaidCash = parseFloat(currentUmrah.paidCash) || 0;
    const currentPaidInBank = parseFloat(currentUmrah.paidInBank) || 0;

    const newRemainingAmountForUmrah = currentRemaining - (amountPaidCash + amountPaidBank);
    const newPaidCash = currentPaidCash + amountPaidCash;
    const newPaidInBank = currentPaidInBank + amountPaidBank;

    // Insert payment record
    const newPayment = await db
      .insertInto('umrah_payments')
      .values({
        umrah_id: body.umrah_id,
        payment_date: formatDateForDB(body.payment_date) || now.toISOString().split('T')[0],
        payed_cash: amountPaidCash.toString(),
        paid_bank: amountPaidBank.toString(),
        bank_title: body.bank_title || null,
        recorded_by: body.recorded_by,
        created_at: now,
        remaining_amount: newRemainingAmountForUmrah,
      })
      .returningAll()
      .executeTakeFirst();

    // Update umrah booking amounts
    const updatedUmrah = await db
      .updateTable('Umrah')
      .set({
        remainingAmount: newRemainingAmountForUmrah,
        paidCash: newPaidCash,
        paidInBank: newPaidInBank,
        updatedAt: now,
      })
      .where('id', '=', body.umrah_id)
      .returningAll()
      .executeTakeFirst();

    return {
      status: 'success',
      code: 201,
      message: 'Umrah payment recorded and amounts updated successfully',
      payment: newPayment,
      umrah: updatedUmrah,
    };
  } catch (error) {
    console.error('Error in createUmrahPayment service:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to record Umrah payment or update booking',
      errors: error.message,
    };
  }
};

export const getUmrahPaymentsByUmrahId = async (umrahId: number, db: any) => {
  try {
    const payments = await db
      .selectFrom('umrah_payments')
      .selectAll()
      .where('umrah_id', '=', umrahId)
      .orderBy('created_at', 'asc') // Order by creation timestamp for chronological history
      .execute();

    if (!payments || payments.length === 0) {
      return {
        status: 'success',
        code: 200,
        message: 'No payments found for this Umrah booking',
        payments: [],
      };
    }

    return {
      status: 'success',
      code: 200,
      message: 'Umrah payment history fetched successfully',
      payments: payments,
    };
  } catch (error) {
    console.error('Error in getUmrahPaymentsByUmrahId service:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch Umrah payment history',
      errors: error.message,
    };
  }
};

export const updateUmrahPayment = async (paymentId: number, body: any, db: any) => {
  try {
    // Get the current payment to calculate differences
    const currentPayment = await db
      .selectFrom('umrah_payments')
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

    // Get current Umrah booking
    const currentUmrah = await db
      .selectFrom('Umrah')
      .select(['remainingAmount', 'paidCash', 'paidInBank'])
      .where('id', '=', currentPayment.umrah_id)
      .executeTakeFirst();

    if (!currentUmrah) {
      return {
        status: 'error',
        code: 404,
        message: 'Umrah booking not found',
      };
    }

    const newRemainingAmount = parseFloat(currentUmrah.remainingAmount) - totalDifference;
    const newPaidCash = parseFloat(currentUmrah.paidCash) + cashDifference;
    const newPaidInBank = parseFloat(currentUmrah.paidInBank) + bankDifference;

    // Update the payment record
    const updatedPayment = await db
      .updateTable('umrah_payments')
      .set({
        payment_date: formatDateForDB(body.payment_date),
        payed_cash: newCashAmount.toString(),
        paid_bank: newBankAmount.toString(),
        bank_title: body.bank_title || null,
        recorded_by: body.recorded_by,
        remaining_amount: newRemainingAmount,
      })
      .where('id', '=', paymentId)
      .returningAll()
      .executeTakeFirst();

    // Update the Umrah booking amounts
    await db
      .updateTable('Umrah')
      .set({
        remainingAmount: newRemainingAmount,
        paidCash: newPaidCash,
        paidInBank: newPaidInBank,
      })
      .where('id', '=', currentPayment.umrah_id)
      .execute();

    return {
      status: 'success',
      code: 200,
      message: 'Payment updated successfully',
      payment: updatedPayment,
    };
  } catch (error) {
    console.error('Error in updateUmrahPayment service:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to update payment',
      errors: error.message,
    };
  }
};

export const deleteUmrahPayment = async (paymentId: number, db: any) => {
  try {
    // Get the payment record to reverse the amounts
    const paymentRecord = await db
      .selectFrom('umrah_payments')
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

    // Get current Umrah booking
    const currentUmrah = await db
      .selectFrom('Umrah')
      .select(['remainingAmount', 'paidCash', 'paidInBank'])
      .where('id', '=', paymentRecord.umrah_id)
      .executeTakeFirst();

    if (!currentUmrah) {
      return {
        status: 'error',
        code: 404,
        message: 'Umrah booking not found',
      };
    }

    // Reverse the payment amounts
    const newRemainingAmount = parseFloat(currentUmrah.remainingAmount) + cashAmount + bankAmount;
    const newPaidCash = parseFloat(currentUmrah.paidCash) - cashAmount;
    const newPaidInBank = parseFloat(currentUmrah.paidInBank) - bankAmount;

    // Delete the payment record
    const deletedPayment = await db
      .deleteFrom('umrah_payments')
      .where('id', '=', paymentId)
      .returningAll()
      .executeTakeFirst();

    // Update the Umrah booking amounts
    await db
      .updateTable('Umrah')
      .set({
        remainingAmount: newRemainingAmount,
        paidCash: newPaidCash,
        paidInBank: newPaidInBank,
      })
      .where('id', '=', paymentRecord.umrah_id)
      .execute();

    return {
      status: 'success',
      code: 200,
      message: 'Payment deleted successfully and Umrah amounts updated',
      payment: deletedPayment,
    };
  } catch (error) {
    console.error('Error in deleteUmrahPayment service:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to delete payment',
      errors: error.message,
    };
  }
};