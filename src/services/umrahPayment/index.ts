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