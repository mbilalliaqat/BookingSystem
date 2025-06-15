
export const createRefunded = async (body: any, db: any) => {
  try {
    const newRefunded = await db
      .insertInto('refunded')
      .values({
        name: body.name,
        employee:body.employee,
        date: body.date,
        passport: body.passport,
        reference: body.reference,
        paid_fee_date:body.paid_fee_date,
        paid_refund_date:body.paid_refund_date,
        total_balance:body.total_balance,
        withdraw:body.withdraw
      })
      .returningAll()
      .executeTakeFirst();

    return {
      status: 'success',
      code: 201,
      message: 'Refunded record created successfully',
      refunded: newRefunded
    };
  } catch (error) {
    console.error('Error in createRefunded:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to create refunded record',
      errors: error.message
    };
  }
};

export const getRefunded = async (db: any) => {
  try {
    const refunded = await db
      .selectFrom('refunded')
      .selectAll()
      .execute();

    return {
      status: 'success',
      code: 200,
      refunded: refunded
    };
  } catch (error) {
    console.error('Error in getRefunded:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch refunded records',
      errors: error.message
    };
  }
};

export const updateRefunded = async (id: number, body: any, db: any) => {
  try {
    const updatedRefunded = await db
      .updateTable('refunded')
      .set({
        name: body.name,
        employee:body.employee,
        date: body.date,
        passport: body.passport,
        reference: body.reference,
        paid_fee_date:body.paid_fee_date,
        paid_refund_date:body.paid_refund_date,
        total_balance:body.total_balance,
        withdraw:body.withdraw
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!updatedRefunded) {
      return {
        status: 'error',
        code: 404,
        message: 'Refunded record not found'
      };
    }

    return {
      status: 'success',
      code: 200,
      message: 'Refunded record updated successfully',
      refunded: updatedRefunded
    };
  } catch (error) {
    console.error('Error in updateRefunded:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to update refunded record',
      errors: error.message
    };
  }
};

export const deleteRefunded = async (id: number, db: any) => {
  try {
    const deletedRefunded = await db
      .deleteFrom('refunded')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!deletedRefunded) {
      return {
        status: 'error',
        code: 404,
        message: 'Refunded record not found'
      };
    }

    return {
      status: 'success',
      code: 200,
      message: 'Refunded record deleted successfully',
      refunded: deletedRefunded
    };
  } catch (error) {
    console.error('Error in deleteRefunded:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to delete refunded record',
      errors: error.message
    };
  }
};