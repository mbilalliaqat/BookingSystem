import { incrementEntryCounts } from '../counters';
import { archiveRecord } from '../archive';

const formatDateForDB = (dateStr: string | null | undefined): string | null => {
  if (!dateStr || dateStr.trim() === '') {
    return null;
  }
  return dateStr;
};

export const createOtherCp = async (body: any, db: any) => {
  try {
    const now = new Date();
    // Extract number after space and before slash: "OCP 1/3" -> 1
    const entryMatch = body.entry.match(/(\d+)\/\d+/);
    const currentEntryNumber = entryMatch ? parseInt(entryMatch[1]) : null;

    const newOtherCp = await db
      .insertInto('other_cp')
      .values({
        date: formatDateForDB(body.date) || now.toISOString().split('T')[0],
        entry: body.entry,
        employee: body.employee,
        detail: body.detail,
        card_payment: body.card_payment,
        card_amount: body.card_amount || 0,
        receivable_amount: body.receivable_amount || 0,
        paid_cash: body.paid_cash || 0,
        paid_from_bank: body.paid_from_bank || null,
        paid_in_bank: body.paid_in_bank || 0,
        agent_name: body.agent_name || null,
        profit: body.profit || 0,
        remaining_amount: body.remaining_amount || 0,
        created_at: now,
        updated_at: now,
      })
      .returningAll()
      .executeTakeFirst();

    if (newOtherCp && currentEntryNumber) {
      console.log('Calling incrementEntryCounts for Other CP');
      await incrementEntryCounts('other_cp', currentEntryNumber, db);
    }

    return {
      status: 'success',
      code: 201,
      message: 'Other CP entry created successfully',
      data: newOtherCp,
    };
  } catch (error: any) {
    console.error('Error in createOtherCp:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to create Other CP entry',
      errors: error.message,
    };
  }
};

export const getAllOtherCp = async (db: any) => {
  try {
    const otherCpEntries = await db
      .selectFrom('other_cp')
      .selectAll()
      .orderBy('created_at', 'desc')
      .execute();

    return {
      status: 'success',
      code: 200,
      message: otherCpEntries.length > 0 ? 'Other CP entries fetched successfully' : 'No Other CP entries found',
      otherCpEntries,
    };
  } catch (error: any) {
    console.error('Error in getAllOtherCp:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch Other CP entries',
      errors: error.message,
    };
  }
};

export const getOtherCpById = async (id: number, db: any) => {
  try {
    const otherCp = await db
      .selectFrom('other_cp')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!otherCp) {
      return {
        status: 'error',
        code: 404,
        message: 'Other CP entry not found',
      };
    }

    return {
      status: 'success',
      code: 200,
      message: 'Other CP entry fetched successfully',
      data: otherCp,
    };
  } catch (error: any) {
    console.error('Error in getOtherCpById:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch Other CP entry',
      errors: error.message,
    };
  }
};

export const updateOtherCp = async (id: number, body: any, db: any) => {
  try {
    const now = new Date();

    const updatedOtherCp = await db
      .updateTable('other_cp')
      .set({
        date: formatDateForDB(body.date),
        entry: body.entry,
        employee: body.employee,
        detail: body.detail,
        card_payment: body.card_payment,
        card_amount: body.card_amount || 0,
        receivable_amount: body.receivable_amount || 0,
        paid_cash: body.paid_cash || 0,
        paid_from_bank: body.paid_from_bank || null,
        paid_in_bank: body.paid_in_bank || 0,
        agent_name: body.agent_name || null,
        profit: body.profit || 0,
        remaining_amount: body.remaining_amount || 0,
        updated_at: now,
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!updatedOtherCp) {
      return {
        status: 'error',
        code: 404,
        message: 'Other CP entry not found',
      };
    }

    return {
      status: 'success',
      code: 200,
      message: 'Other CP entry updated successfully',
      data: updatedOtherCp,
    };
  } catch (error: any) {
    console.error('Error in updateOtherCp:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to update Other CP entry',
      errors: error.message,
    };
  }
};

export const deleteOtherCp = async (id: number, db: any, deletedBy: string = 'system') => {
  try {
    // 1. Get other_cp entry data
    const otherCpRecord = await db
      .selectFrom('other_cp')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!otherCpRecord) {
      return { status: 'error', code: 404, message: 'Other CP entry not found' };
    }

    // 2. Archive the entry
    const archiveResult = await archiveRecord('other_cp', id, otherCpRecord, db, deletedBy);

    if (archiveResult.status !== 'success') {
      return { 
        status: 'error', 
        code: 500, 
        message: 'Failed to archive Other CP entry', 
        errors: archiveResult.message 
      };
    }

    // 3. Delete the entry
    const deleted = await db
      .deleteFrom('other_cp')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    return {
      status: 'success',
      code: 200,
      message: 'Other CP entry archived and deleted successfully',
      data: deleted,
    };
  } catch (error: any) {
    console.error('Error deleting Other CP entry:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to delete Other CP entry',
      errors: error.message,
    };
  }
};