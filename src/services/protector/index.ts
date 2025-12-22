import { incrementEntryCounts } from "../counters";
import { archiveRecord } from '../archive';


export const createProtector = async (body: any, db:any) => {
  try {
    const now = new Date();
    const [currentEntryNumber] = body.entry.split('/').map(Number);

    const newProtector = await db
      .insertInto('protector')
      .values({
        name: body.name,
         entry: body.entry,
        passport: body.passport,
        reference: body.reference,
        mcb_fee_6000_date: body.mcb_fee_6000_date,
        ncb_fee_6700_date: body.ncb_fee_6700_date,
        ncb_fee_500_date: body.ncb_fee_500_date,
        protector_date: body.protector_date,
        additional_charges: body.additional_charges,
        file_no: body.file_no,
        employee: body.employee,
        withdraw: body.withdraw,
        createdAt: now
      })
      .returningAll()
      .executeTakeFirst();
        if (newProtector) {
            await incrementEntryCounts('protector', currentEntryNumber, db); // Update entry_counters table
          }

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
     const now = new Date();
    const updatedProtector = await db
      .updateTable('protector')
      .set({
        name: body.name,
         entry: body.entry,
        passport: body.passport,
        reference: body.reference,
        mcb_fee_6000_date: body.mcb_fee_6000_date,
        ncb_fee_6700_date: body.ncb_fee_6700_date,
        ncb_fee_500_date: body.ncb_fee_500_date,
        protector_date: body.protector_date,
        additional_charges: body.additional_charges,
        file_no: body.file_no,
        employee: body.employee,
        withdraw: body.withdraw,
        createdAt: now
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

export const deleteProtector = async (id: number, db:any, deletedBy: string = 'system') => {
  try {
    // 1. Fetch protector
    const protectorRecord = await db
      .selectFrom('protector')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!protectorRecord) {
      return { status: 'error', code: 404, message: 'Protector not found' };
    }

    // 2. Archive protector
    const archiveResult = await archiveRecord('protector', id, { protector: protectorRecord }, db, deletedBy);

    if (archiveResult.status !== 'success') {
      return { status: 'error', code: 500, message: 'Failed to archive protector', errors: archiveResult.message };
    }

    // 3. Delete protector
    const deletedProtector = await db
      .deleteFrom('protector')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    return {
      status: 'success',
      code: 200,
      message: 'Protector archived and deleted successfully',
      protector: deletedProtector
    };
  } catch (error: any) {
    console.error('Error in deleteProtector:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to delete protector',
      errors: error.message
    };
  }
};