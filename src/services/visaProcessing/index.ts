import { incrementEntryCounts } from "../counters";

export const createVisaProcessing = async (body: any, db: any) => {
    try {
      const now = new Date();
  
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
          paid_cash: body.paid_cash,
          paid_in_bank: body.paid_in_bank,
          profit: body.profit,
          remaining_amount: body.remaining_amount
        })
        .returningAll()
        .executeTakeFirst();

        if (newVisaProcessing) {
        await incrementEntryCounts('visa', db); 
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
          paid_cash: body.paid_cash,
          paid_in_bank: body.paid_in_bank,
          profit: body.profit,
          remaining_amount: body.remaining_amount
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
  