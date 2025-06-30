// backend/src/services/counters.ts

interface KyselyDatabaseOperations {
    selectFrom: (tableName: string) => any;
    updateTable: (tableName: string) => any;
    transaction: () => { execute: (callback: (trx: any) => Promise<any>) => Promise<any> };
}

/**
 * Fetches all current entry counts from the database.
 */
export const getEntryCounts = async (db: KyselyDatabaseOperations) => {
  try {
    const counts = await db.selectFrom('entry_counters').selectAll().execute();
    return {
      status: 'success',
      code: 200,
      message: 'Entry counts retrieved successfully',
      data: counts
    };
  } catch (error: any) {
    console.error('Error fetching entry counts:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to retrieve entry counts',
      errors: error.message
    };
  }
};

/**
 * Updates a specific form type's count and the global count across all rows.
 * @param formType The type of form (e.g., 'ticket', 'umrah', 'gamca').
 * @param actualEntryNumber The actual entry number that was just used for a new record.
 * @param db The database instance.
 * @returns The updated form and global counts.
 */
export const incrementEntryCounts = async (formType: string, actualEntryNumber: number, db: KyselyDatabaseOperations) => {
  try {
    const result = await db.transaction().execute(async (trx) => {
      // Get the current form-specific count to check if this is a new entry
      const currentFormRow = await trx
        .selectFrom('entry_counters')
        .select('current_count')
        .where('form_type', '=', formType)
        .executeTakeFirst();

      const currentFormCount = currentFormRow?.current_count || 0;

      // Update the form-specific current_count to the actualEntryNumber
      const updatedFormCount = await trx
        .updateTable('entry_counters')
        .set({ current_count: actualEntryNumber })
        .where('form_type', '=', formType)
        .returning(['form_type', 'current_count'])
        .executeTakeFirstOrThrow();

      // Get the current global count from the 'global' row
      const globalRow = await trx
        .selectFrom('entry_counters')
        .select('global_count')
        .where('form_type', '=', 'global')
        .executeTakeFirst();

      const currentGlobalCount = globalRow?.global_count || 0;
      
      // Only increment global count if this is actually a new entry
      // (i.e., actualEntryNumber is greater than the previous current_count)
      let newGlobalCount = currentGlobalCount;
      if (actualEntryNumber > currentFormCount) {
        newGlobalCount = currentGlobalCount + 1;
        
        // Update the global_count for all rows
        await trx
          .updateTable('entry_counters')
          .set({ global_count: newGlobalCount })
          .execute();
      }

      return {
        formType: updatedFormCount.form_type,
        currentCount: updatedFormCount.current_count,
        globalCount: newGlobalCount,
      };
    });

    return {
      status: 'success',
      code: 200,
      message: 'Entry counts updated successfully',
      data: result
    };
  } catch (error: any) {
    console.error(`Error updating entry counts:`, error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to update entry counts',
      errors: error.message
    };
  }
};