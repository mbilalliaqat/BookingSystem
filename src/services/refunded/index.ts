import { incrementEntryCounts } from "../counters";
import { archiveRecord } from '../archive';

export const createRefunded = async (body: any, db: any) => {
  try {
    const [currentEntryNumber] = body.entry.split('/').map(Number);
     
    const newRefunded = await db
      .insertInto('refunded')
      .values({
        name: body.name,
        employee: body.employee,
        entry: body.entry,
        date: body.date,
        passport: body.passport,
        reference: body.reference,
        paid_fee_date: body.paid_fee_date,
        paid_refund_date: body.paid_refund_date,
        total_balance: body.total_balance,
        withdraw: body.withdraw,
        bank_name: body.bank_name || null,     // ADDED
        paid_bank: body.paid_bank || null      // ADDED
      })
      .returningAll()
      .executeTakeFirst();

    if (newRefunded) {
      await incrementEntryCounts('refunded', currentEntryNumber, db);
    }

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
        employee: body.employee,
        entry: body.entry,
        date: body.date,
        passport: body.passport,
        reference: body.reference,
        paid_fee_date: body.paid_fee_date,
        paid_refund_date: body.paid_refund_date,
        total_balance: body.total_balance,
        withdraw: body.withdraw,
        bank_name: body.bank_name || null,     // ADDED
        paid_bank: body.paid_bank || null      // ADDED
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

export const deleteRefunded = async (id: number, db: any, deletedBy: string = 'system') => {
  try {
    // 1. Fetch refunded record
    const refundedRecord = await db
      .selectFrom('refunded')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!refundedRecord) {
      return { status: 'error', code: 404, message: 'Refunded record not found' };
    }

    // 2. Archive refunded record
    const archiveResult = await archiveRecord('refunded', id, { refunded: refundedRecord }, db, deletedBy);

    if (archiveResult.status !== 'success') {
      return { status: 'error', code: 500, message: 'Failed to archive refunded record', errors: archiveResult.message };
    }

    // 3. Delete refunded record
    const deletedRefunded = await db
      .deleteFrom('refunded')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    return {
      status: 'success',
      code: 200,
      message: 'Refunded record archived and deleted successfully',
      refunded: deletedRefunded
    };
  } catch (error: any) {
    console.error('Error in deleteRefunded:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to delete refunded record',
      errors: error.message
    };
  }
};