interface KyselyDatabaseOperations {
    selectFrom: (tableName: string) => any;
    insertInto: (tableName: string) => any;
    updateTable: (tableName: string) => any;
    transaction: () => { execute: (callback: (trx: any) => Promise<any>) => Promise<any> };
}

export const getEntryCounts = async (db: KyselyDatabaseOperations) => {
  try {
    let counts = await db.selectFrom('entry_counters').selectAll().execute();

    // Ensure all required rows exist
    const requiredTypes = ['global', 'gamca', 'ticket', 'umrah', 'services', 'other-cp','navtcc','protector','refunded','refund','account','e-number','bank-detail'];
    
    for (const type of requiredTypes) {
      if (!counts.find(c => c.form_type === type)) {
        await db
          .insertInto('entry_counters')
          .values({ form_type: type, current_count: 0, global_count: 0 })
          .execute();
      }
    }

    // Fetch updated counts
    counts = await db.selectFrom('entry_counters').selectAll().execute();
    console.log('Fetched entry counts:', JSON.stringify(counts, null, 2));

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
      
      // Only increment global count for main form types if this is a new entry
      let newGlobalCount = currentGlobalCount;
      // FIXED: Added 'other-cp' to the mainFormTypes array
      const mainFormTypes = ['gamca', 'ticket', 'umrah', 'services', 'other-cp','other-cp','navtcc','protector','refunded','refund','account','e-number','bank-detail'];
      if (actualEntryNumber > currentFormCount && mainFormTypes.includes(formType)) {
        newGlobalCount = currentGlobalCount + 1;
        // Update the global_count for all rows
        await trx
          .updateTable('entry_counters')
          .set({ global_count: newGlobalCount })
          .execute();
      }

      console.log(`Incrementing counts: formType=${formType}, actualEntryNumber=${actualEntryNumber}, currentFormCount=${currentFormCount}, newGlobalCount=${newGlobalCount}`);

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