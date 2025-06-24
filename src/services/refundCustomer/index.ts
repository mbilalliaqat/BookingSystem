export const createRefundCustomer = async (body: any, db: any) => {
    try {
      const newRefundCustomer = await db
        .insertInto('refund_customer')
        .values({
          employee: body.employee,
          name: body.name,
          date: body.date,
          passport: body.passport,
          reference: body.reference,
          detail_sector: body.detail_sector,
          total_amount: body.total_amount,
          return_from_vendor: body.return_from_vendor,
          office_service_charges: body.office_service_charges,
          remaining_amount: body.remaining_amount,
          bank_title:body.bank_title,
          paid_cash: body.paid_cash,
          paid_in_bank: body.paid_in_bank,
          vender_name:body.vender_name,
          balance: body.balance,
        })
        .returningAll()
        .executeTakeFirst();

      return {
        status: 'success',
        code: 201,
        message: 'Refund customer created successfully',
        refundCustomer: newRefundCustomer
      };
    } catch (error) {
      console.error('Error in createRefundCustomer service:', error);
      return {
        status: 'error',
        code: 500,
        message: 'Failed to create refund customer',
        errors: error.message
      };
    }
};

export const updateRefundCustomer = async (id: number, body: any, db: any) => {
    try {
      const updatedRefundCustomer = await db
        .updateTable('refund_customer')
        .set({
          employee: body.employee,
          name: body.name,
          date: body.date,
          passport: body.passport,
          reference: body.reference,
          detail_sector: body.detail_sector,
          total_amount: body.total_amount,
          return_from_vendor: body.return_from_vendor,
          office_service_charges: body.office_service_charges,
          remaining_amount: body.remaining_amount,
          paid_cash: body.paid_cash,
          paid_in_bank: body.paid_in_bank,
          bank_title:body.bank_title,
          vender_name:body.vender_name,
          balance: body.balance,
        })
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();

      if (!updatedRefundCustomer) {
        return {
          status: 'error',
          code: 404,
          message: 'Refund customer not found',
        };
      }

      return {
        status: 'success',
        code: 200,
        message: 'Refund customer updated successfully',
        refundCustomer: updatedRefundCustomer,
      };
    } catch (error) {
      console.error('Error in updateRefundCustomer service:', error);
      return {
        status: 'error',
        code: 500,
        message: 'Failed to update refund customer',
        errors: error.message,
      };
    }
};

export const deleteRefundCustomer = async (id: number, db: any) => {
    try {
      const deletedRefundCustomer = await db
        .deleteFrom('refund_customer')
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();

      if (!deletedRefundCustomer) {
        return {
          status: 'error',
          code: 404,
          message: 'Refund customer not found'
        };
      }

      return {
        status: 'success',
        code: 200,
        message: 'Refund customer deleted successfully',
        refundCustomer: deletedRefundCustomer,
      };
    } catch (error) {
      console.error("Error in deleteRefundCustomer service:", error);
      return {
        status: 'error',
        code: 500,
        message: 'Failed to delete refund customer',
        errors: error.message,
      };
    }
};