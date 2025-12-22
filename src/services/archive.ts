// services/archive.ts
export const archiveRecord = async (
  moduleName: string,
  recordId: number,
  recordData: any,
  db: any,
  deletedBy: string = 'system'
) => {
  try {
    const now = new Date();

    await db
      .insertInto('archived_data')
      .values({
        module_name: moduleName,
        original_record_id: recordId,
        record_data: JSON.stringify(recordData),
        deleted_by: deletedBy, // Pass user info if available
        deleted_at: now,
      })
      .execute();

    return { status: 'success', code: 200 };
  } catch (error) {
    console.error('Archive error:', error);
    return { status: 'error', code: 500, message: error.message };
  }
};

export const getArchivedRecords = async (moduleName: string | null, db: any) => {
  try {
    let query = db
      .selectFrom('archived_data')
      .selectAll();
    
    // Only add WHERE clause if moduleName is provided and not 'all'
    if (moduleName && moduleName !== 'all') {
      query = query.where('module_name', '=', moduleName);
    }
    
    const records = await query
      .orderBy('deleted_at', 'desc')
      .execute();

    return {
      status: 'success',
      code: 200,
      records: records.map(r => ({
        ...r,
        record_data: JSON.parse(r.record_data)
      }))
    };
  } catch (error) {
    return { status: 'error', code: 500, message: error.message };
  }
};

export const restoreRecord = async (archiveId: number, db: any) => {
  try {
    const rows = await db
      .selectFrom('archived_data')
      .selectAll()
      .where('id', '=', archiveId)
      .execute();

    const record = rows[0];
    if (!record) {
      return { status: 'error', code: 404, message: 'Archived record not found' };
    }

    const { module_name, record_data } = record;
    const data = JSON.parse(record_data);

    // Insert back into original table (assumes table name equals module_name)
    await db
      .insertInto(module_name)
      .values(data)
      .execute();

    // Remove the entry from archive after successful restore
    await db.deleteFrom('archived_data').where('id', '=', archiveId).execute();

    return { status: 'success', code: 200, message: 'Record restored' };
  } catch (error) {
    console.error('Restore error:', error);
    return { status: 'error', code: 500, message: error.message };
  }
};

export const deleteArchivedRecord = async (archiveId: number, db: any) => {
  try {
    const rows = await db
      .selectFrom('archived_data')
      .selectAll()
      .where('id', '=', archiveId)
      .execute();

    if (!rows[0]) {
      return { status: 'error', code: 404, message: 'Archived record not found' };
    }

    await db.deleteFrom('archived_data').where('id', '=', archiveId).execute();

    return { status: 'success', code: 200, message: 'Archived record deleted' };
  } catch (error) {
    console.error('Delete archive error:', error);
    return { status: 'error', code: 500, message: error.message };
  }
};