import { incrementEntryCounts } from "../counters";


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

    // ✅ FIXED: Changed from body.payment_amount to body.payed_cash
    const amountPaidCash = parseFloat(body.payed_cash) || 0;
    const amountPaidBank = parseFloat(body.paid_bank) || 0;

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
        payed_cash: amountPaidCash.toString(),
        paid_bank: amountPaidBank.toString(),
        bank_title: body.bank_title || null,
        recorded_by: body.recorded_by,
        created_at: now,
        remaining_amount: newRemainingAmount,
      })
      .returningAll()
      .executeTakeFirst();

    // Update GAMCA token record
    const updatedGamcaToken = await db
      .updateTable('gamca_token')
      .set({
        remaining_amount: newRemainingAmount,
        paid_cash: newPaidCash,
        paid_in_bank: newPaidInBank,
        updated_at: now,
      })
      .where('id', '=', body.gamca_token_id)
      .returningAll()
      .executeTakeFirst();

    return {
      status: 'success',
      code: 201,
      message: 'GAMCA token payment recorded and amounts updated successfully',
      payment: newPayment,
      gamca_token: updatedGamcaToken,
    };
  } catch (error) {
    console.error('Error in createGamcaTokenPayment service:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to record GAMCA token payment or update record',
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
      .orderBy('created_at', 'asc') // Order by creation timestamp for chronological history
      .execute();

    if (!payments || payments.length === 0) {
      return {
        status: 'success',
        code: 200,
        message: 'No payments found for this GAMCA token record',
        payments: [],
      };
    }

    return {
      status: 'success',
      code: 200,
      message: 'GAMCA token payment history fetched successfully',
      payments: payments,
    };
  } catch (error) {
    console.error('Error in getGamcaTokenPaymentsByTokenId service:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch GAMCA token payment history',
      errors: error.message,
    };
  }
};

// Updated createGamcaToken function with initial payment tracking
export const createGamcaToken = async (body: any, db: any) => {
  try {
    const now = new Date(); 
    const [currentEntryNumber] = body.entry.split('/').map(Number);

    const newGamcaToken = await db
      .insertInto('gamca_token')
      .values({
        employee_name: body.employee_name,
        customer_add: body.customer_add,
        entry: body.entry,
        reference: body.reference,
        country: body.country,
        passport_detail: body.passport_detail,
        receivable_amount: body.receivable_amount,
        paid_cash: body.paid_cash || 0,
        paid_from_bank: body.paid_from_bank || 0,
        paid_in_bank: body.paid_in_bank || 0,
        profit: body.profit || 0,
        remaining_amount: body.remaining_amount || 0,
        // Add initial payment tracking fields
        initial_paid_cash: body.paid_cash || 0,
        initial_paid_in_bank: body.paid_in_bank || 0,
        created_at: now,
        updated_at: now
      })
      .returningAll()
      .executeTakeFirst();

    if (newGamcaToken) {
      await incrementEntryCounts('gamca', currentEntryNumber, db);
    }

    return {
      status: 'success',
      code: 201,
      message: 'Gamca token created successfully',
      data: newGamcaToken
    };
  } catch (error) {
    console.error('Error in createGamcaToken service:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to create Gamca token',
      errors: error.message
    };
  }
};

// Updated updateGamcaToken function to preserve initial payment values
export const updateGamcaToken = async (id: number, body: any, db: any) => {
  try {
    // Get current GAMCA token data to preserve initial values
    const currentGamcaToken = await db
      .selectFrom('gamca_token')
      .select(['initial_paid_cash', 'initial_paid_in_bank'])
      .where('id', '=', id)
      .executeTakeFirst();

    const updatedGamcaToken = await db
      .updateTable('gamca_token')
      .set({
        employee_name: body.employee_name,
        customer_add: body.customer_add,
        entry: body.entry,
        reference: body.reference,
        country: body.country,
        passport_detail: body.passport_detail,
        receivable_amount: body.receivable_amount,
        paid_cash: body.paid_cash || 0,
        paid_from_bank: body.paid_from_bank || 0,
        paid_in_bank: body.paid_in_bank || 0,
        profit: body.profit || 0,
        remaining_amount: body.remaining_amount || 0,
        // Preserve initial values or set them if they don't exist
        initial_paid_cash: currentGamcaToken?.initial_paid_cash || body.paid_cash || 0,
        initial_paid_in_bank: currentGamcaToken?.initial_paid_in_bank || body.paid_in_bank || 0,
        updated_at: new Date()
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!updatedGamcaToken) {
      return {
        status: 'error',
        code: 404,
        message: 'Gamca token record not found'
      };
    }

    return {
      status: 'success',
      code: 200,
      message: 'Gamca token record updated successfully',
      data: updatedGamcaToken
    };
  } catch (error) {
    console.error('Error in updateGamcaToken service:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to update gamca token record',
      errors: error.message
    };
  }
};
  
export const deleteGamcaToken = async (id: number, db: any) => {
  try {
    const deletedGamcaToken = await db
      .deleteFrom('gamca_token')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!deletedGamcaToken) {
      return {
        status: 'error',
        code: 404,
        message: 'Gamca token record not found'
      };
    }

    return {
      status: 'success',
      code: 200,
      message: 'Gamca token record deleted successfully'
    };
  } catch (error) {
    console.error('Error in deleteGamcaToken service:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to delete gamca token record',
      errors: error.message
    };
  }
};