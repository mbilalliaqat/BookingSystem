import { archiveRecord } from '../archive';

export const deleteUmrah = async (id: number, db: any, deletedBy: string = 'system') => {
  try {
    // 1. Get umrah data
    const umrahRecord = await db
      .selectFrom('Umrah')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!umrahRecord) {
      return { status: 'error', code: 404, message: 'Umrah not found' };
    }

    // 2. Get related payments
    const payments = await db
      .selectFrom('umrah_payments')
      .selectAll()
      .where('umrah_id', '=', id)
      .execute();

    // 3. Archive with all related data
    const archiveResult = await archiveRecord('Umrah', id, {
      umrah: umrahRecord,
      payments: payments
    }, db, deletedBy);

    if (archiveResult.status !== 'success') {
      return { status: 'error', code: 500, message: 'Failed to archive umrah', errors: archiveResult.message };
    }

    // 4. Delete payments
    await db
      .deleteFrom('umrah_payments')
      .where('umrah_id', '=', id)
      .execute();

    // 5. Delete umrah
    const deletedUmrah = await db
      .deleteFrom('Umrah')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    return {
      status: 'success',
      code: 200,
      message: 'Umrah archived and deleted successfully',
      umrah: deletedUmrah,
    };
  } catch (error) {
    console.error('Error in deleteUmrah service:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to delete umrah',
      errors: error.message,
    };
  }
};