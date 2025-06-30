import { incrementEntryCounts } from "../counters";

export const createGamcaToken = async (body: any, db: any) => {
    try {
      const now = new Date(); 
      const [currentEntryNumber] = body.entry.split('/').map(Number);
  
      const newGamcaToken = await db
        .insertInto('gamca_token') // Table name
        .values({
          employee_name: body.employee_name,
          customer_add: body.customer_add,
           entry: body.entry,
          reference: body.reference,
          country: body.country,
          passport_detail: body.passport_detail,
          receivable_amount: body.receivable_amount,
          paid_cash: body.paid_cash,
          paid_from_bank: body.paid_from_bank,
          paid_in_bank: body.paid_in_bank,
          profit: body.profit,
          remaining_amount: body.remaining_amount,
          created_at: now // Timestamp for when the record is created
        })
        .returningAll() // Return the full object of the inserted record
        .executeTakeFirst(); // Executes the query and returns the first row
  
        if (newGamcaToken) {
      await incrementEntryCounts('gamca', currentEntryNumber, db); // Update entry_counters table
    }

      return {
        status: 'success',
        code: 201,
        message: 'Gamca token created successfully',
        data: newGamcaToken // Data returned after insertion
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
  
  export const updateGamcaToken = async (id: number, body: any, db: any) => {
    try {
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
          paid_cash: body.paid_cash,
          paid_from_bank: body.paid_from_bank,
          paid_in_bank: body.paid_in_bank,
          profit: body.profit,
          remaining_amount: body.remaining_amount
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