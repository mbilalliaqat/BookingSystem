

export const createProtector = async (body: any, db:any) => {
  try {
    const newProtector = await db
      .insertInto('protector')
      .values({
        name: body.name,
        passport: body.passport,
        reference: body.reference,
        mcb_fee_6000_date: body.mcb_fee_6000_date,
        ncb_fee_6700_date: body.ncb_fee_6700_date,
        ncb_fee_500_date: body.ncb_fee_500_date,
        protector_date: body.protector_date,
        additional_charges: body.additional_charges,
        file_no: body.file_no,
        employee: body.employee,
        withdraw: body.withdraw
      })
      .returningAll()
      .executeTakeFirst();

    return {
      status: 'success',
      code: 201,
      message: 'Protector created successfully',
      protector: newProtector
    };
  } catch (error) {
    console.error('Error in createProtector:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to create protector',
      errors: error.message
    };
  }
};

export const getProtectors = async (db:any) => {
  try {
    const protectors = await db
      .selectFrom('protector')
      .selectAll()
      .execute();

    return {
      status: 'success',
      code: 200,
      protectors: protectors
    };
  } catch (error) {
    console.error('Error in getProtectors:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch protectors',
      errors: error.message
    };
  }
};

export const updateProtector = async (id: number, body: any,db:any) => {
  try {
    const updatedProtector = await db
      .updateTable('protector')
      .set({
        name: body.name,
        passport: body.passport,
        reference: body.reference,
        mcb_fee_6000_date: body.mcb_fee_6000_date,
        ncb_fee_6700_date: body.ncb_fee_6700_date,
        ncb_fee_500_date: body.ncb_fee_500_date,
        protector_date: body.protector_date,
        additional_charges: body.additional_charges,
        file_no: body.file_no,
        employee: body.employee,
        withdraw: body.withdraw
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!updatedProtector) {
      return {
        status: 'error',
        code: 404,
        message: 'Protector not found'
      };
    }

    return {
      status: 'success',
      code: 200,
      message: 'Protector updated successfully',
      protector: updatedProtector
    };
  } catch (error) {
    console.error('Error in updateProtector:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to update protector',
      errors: error.message
    };
  }
};

export const deleteProtector = async (id: number,db:any) => {
  try {
    const deletedProtector = await db
      .deleteFrom('protector')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!deletedProtector) {
      return {
        status: 'error',
        code: 404,
        message: 'Protector not found'
      };
    }

    return {
      status: 'success',
      code: 200,
      message: 'Protector deleted successfully',
      protector: deletedProtector
    };
  } catch (error) {
    console.error('Error in deleteProtector:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to delete protector',
      errors: error.message
    };
  }
};