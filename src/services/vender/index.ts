export const createVender = async (body: any, db: any) => {
  try {
    const newVender = await db
      .insertInto('vender')
      .values({
        user_name: body.user_name,
        entry: body.entry,
        date: body.date,
        amount: body.amount,
        bank_title: body.bank_title,
        debit: parseFloat(body.debit) || 0,
        credit: parseFloat(body.credit) || 0,
        file_path: body.file_path, 
        withdraw:parseFloat(body.withdraw) || 0
      })
      .returningAll()
      .executeTakeFirst();

    return {
      status: 'success',
      code: 201,
      message: 'Vender created successfully',
      vender: newVender
    };
  } catch (error) {
    console.error('Error in createVender:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to create vender',
      errors: error.message
    };
  }
};

export const getVender = async (db: any) => {
  try {
    const vender = await db
      .selectFrom('vender')
      .selectAll()
      .execute();

    return {
      status: 'success',
      code: 200,
      vender: vender
    };
  } catch (error) {
    console.error('Error in getVender:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch vender',
      errors: error.message
    };
  }
};

export const getVenderById = async (id: number, db: any) => {
  try {
    const vender = await db
      .selectFrom('vender')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!vender) {
      return {
        status: 'error',
        code: 404,
        message: 'Vender not found'
      };
    }

    return {
      status: 'success',
      code: 200,
      vender: vender
    };
  } catch (error) {
    console.error('Error in getVenderById:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch vender',
      errors: error.message
    };
  }
};

export const updateVender = async (id: number, body: any, db: any) => {
  try {
    // Build update object, only including file_path if a new file was uploaded
    const updateData: any = {
      user_name: body.user_name,
      entry: body.entry,
      date: body.date,
      amount: body.amount,
      bank_title: body.bank_title,
      debit: parseFloat(body.debit) || 0,
      credit: parseFloat(body.credit) || 0,
      withdraw:parseFloat(body.withdraw) || 0
    };

    // Only update file_path if a new file was provided
    if (body.file_path !== null) {
      updateData.file_path = body.file_path;
    }

    const updatedVender = await db
      .updateTable('vender')
      .set(updateData)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!updatedVender) {
      return {
        status: 'error',
        code: 404,
        message: 'Vender not found'
      };
    }

    return {
      status: 'success',
      code: 200,
      message: 'Vender updated successfully',
      vender: updatedVender
    };
  } catch (error) {
    console.error('Error in updateVender:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to update vender',
      errors: error.message
    };
  }
};

export const deleteVender = async (id: number, db: any) => {
  try {
    const deletedVender = await db
      .deleteFrom('vender')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!deletedVender) {
      return {
        status: 'error',
        code: 404,
        message: 'Vender not found'
      };
    }

    return {
      status: 'success',
      code: 200,
      message: 'Vender deleted successfully',
      vender: deletedVender
    };
  } catch (error) {
    console.error('Error in deleteVender:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to delete vender',
      errors: error.message
    };
  }
};