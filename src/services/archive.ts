// services/archive.ts
export const archiveRecord = async (
  moduleName: string, 
  recordId: number, 
  recordData: any, 
  db: any
) => {
  try {
    const now = new Date();
    
    await db
      .insertInto('archived_data')
      .values({
        module_name: moduleName,
        original_record_id: recordId,
        record_data: JSON.stringify(recordData),
        deleted_by: 'system', // Pass user info if available
        deleted_at: now,
      })
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Archive error:', error);
    return { success: false, error: error.message };
  }
};

export const getArchivedRecords = async (moduleName: string, db: any) => {
  try {
    const records = await db
      .selectFrom('archived_data')
      .selectAll()
      .where('module_name', '=', moduleName)
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
  // Restore logic here
};