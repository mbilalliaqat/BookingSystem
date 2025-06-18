// backend/src/services/counters.ts

// Basic interface for Kysely database operations, for type hinting.
interface KyselyDatabaseOperations {
    selectFrom: (tableName: string) => any;
    updateTable: (tableName: string) => any;
    transaction: () => { execute: (callback: (trx: any) => Promise<any>) => Promise<any> };
}

/**
 * Fetches all current entry counts from the database.
 * @param db The database instance (assumed to be a Kysely instance).
 * @returns An object containing the status, message, and data (array of counts).
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
 * Updates a specific form type's count and the global count to the actual number used.
 * @param formType The type of form (e.g., 'ticket', 'umrah').
 * @param actualEntryNumber The actual entry number that was just used for a new record.
 * @param db The database instance.
 * @returns The updated form and global counts.
 */
export const incrementEntryCounts = async (formType: string, actualEntryNumber: number, db: KyselyDatabaseOperations) => {
  try {
    const result = await db.transaction().execute(async (trx) => {
      let newGlobalCount = actualEntryNumber; // Initialize global count to the actual entry number

      // Update global_count if formType is 'ticket' (assuming global count is tracked by 'ticket' entry)
      if (formType === 'ticket') {
        await trx
          .updateTable('entry_counters')
          .set({ global_count: newGlobalCount })
          .where('form_type', '=', 'ticket')
          .execute();
      }

      // Update the form-specific count to the actualEntryNumber
      const updatedFormCount = await trx
        .updateTable('entry_counters')
        .set({ current_count: actualEntryNumber }) // Set, not increment
        .where('form_type', '=', formType)
        .returning(['form_type', 'current_count'])
        .executeTakeFirstOrThrow();

      return {
        formType: updatedFormCount.form_type,
        currentCount: updatedFormCount.current_count,
        globalCount: newGlobalCount, // Return the updated global count
      };
    });

    return {
      status: 'success',
      code: 200,
      message: 'Entry counts updated successfully', // Changed message
      data: result
    };
  } catch (error: any) {
    console.error(`Error updating entry counts:`, error); // Changed message
    return {
      status: 'error',
      code: 500,
      message: 'Failed to update entry counts',
      errors: error.message
    };
  }
};