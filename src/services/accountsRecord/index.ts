import { incrementEntryCounts } from "../counters";

export const createEntry = async (body: any, db: any) => {
  try {
    const [currentEntryNumber] = body.entry.split('/').map(Number);
    // Get the previous balance for this bank
    let previousBalance = 0;
    const latestEntry = await db
      .selectFrom('office_accounts')
      .select('balance')
      .where('bank_name', '=', body.bank_name)
      .orderBy('id', 'desc')
      .limit(1)
      .executeTakeFirst();
    
    if (latestEntry) {
      previousBalance = Number(latestEntry.balance);
    }
    
    // Calculate new balance
    let newBalance = previousBalance;
    let credit = 0;
    let debit = 0;
    
    if (body.credit && Number(body.credit) > 0) {
      credit = Number(body.credit);
      newBalance += credit;
    } else if (body.debit && Number(body.debit) > 0) {
      debit = Number(body.debit);
      newBalance -= debit;
    }
    
    // Insert the new record
    const newEntry = await db
      .insertInto('office_accounts')
      .values({
        bank_name: body.bank_name,
        entry: body.entry,
        employee_name: body.employee_name,
        date: body.date,
        detail: body.detail,
        credit: credit,
        debit: debit,
        balance: newBalance
      })
      .returningAll()
      .executeTakeFirst();

    if (newEntry) {
      await incrementEntryCounts('account', currentEntryNumber, db);
    }
    
    // Format output
    return {
      id: newEntry.id,
      date: newEntry.date,
      detail: newEntry.detail,
      credit: Number(newEntry.credit),
      debit: Number(newEntry.debit),
      balance: Number(newEntry.balance)
    };
  } catch (error) {
    console.error('Error creating entry:', error);
    throw error;
  }
};

export const getEntriesByBank = async (bankName: string, db: any) => {
  try {
    const entries = await db
      .selectFrom('office_accounts')
      .select(['id', 'entry', 'employee_name', 'date', 'detail', 'credit', 'debit', 'balance'])
      .where('bank_name', '=', bankName)
      .orderBy('id', 'asc') // Order by ID to maintain insertion order
      .execute();
    
    // Format output
    return entries.map(entry => ({
      id: entry.id,
      entry: entry.entry,
      employee_name: entry.employee_name,
      date: entry.date,
      detail: entry.detail,
      credit: Number(entry.credit),
      debit: Number(entry.debit),
      balance: Number(entry.balance)
    }));
  } catch (error) {
    console.error('Error getting entries:', error);
    throw error;
  }
};

export const getBanks = async (db: any) => {
  try {
    const banks = await db
      .selectFrom('office_accounts')
      .select('bank_name')
      .distinct()
      .execute();
    
    return banks.map(b => b.bank_name);
  } catch (error) {
    console.error('Error getting banks:', error);
    throw error;
  }
};

export const updateEntry = async (id: number, body: any, db: any) => {
  try {
    // First get the entry to be updated
    const existingEntry = await db
      .selectFrom('office_accounts')
      .select(['id', 'employee_name', 'bank_name', 'credit', 'debit', 'balance'])
      .where('id', '=', id)
      .executeTakeFirst();

    if (!existingEntry) {
      return null; // Entry not found
    }
    
    // Get all entries for the bank in ID order (to maintain original order)
    const allEntries = await db
      .selectFrom('office_accounts')
      .select(['id', 'employee_name', 'credit', 'debit', 'balance'])
      .where('bank_name', '=', existingEntry.bank_name)
      .orderBy('id', 'asc') // Order by ID instead of date
      .execute();
    
    // Calculate new credit and debit values
    let credit = 0;
    let debit = 0;
    
    if (body.credit && Number(body.credit) > 0) {
      credit = Number(body.credit);
    } else if (body.debit && Number(body.debit) > 0) {
      debit = Number(body.debit);
    }
    
    // Calculate the difference in balance this change will cause
    const oldContribution = Number(existingEntry.credit) - Number(existingEntry.debit);
    const newContribution = credit - debit;
    const balanceDifference = newContribution - oldContribution;
    
    // Update the current entry
    const updatedEntry = await db
      .updateTable('office_accounts')
      .set({
        employee_name: body.employee_name,
        entry: body.entry,
        date: body.date,
        detail: body.detail,
        credit: credit,
        debit: debit,
        // Don't update balance here, we'll do it separately for all affected entries
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
    
    if (!updatedEntry) {
      return null;
    }
    
    // Update balances for all entries from this point forward
    if (balanceDifference !== 0) {
      // Find the index of the updated entry
      const entryIndex = allEntries.findIndex(entry => entry.id === id);
      
      if (entryIndex !== -1) {
        // Update balances for all subsequent entries (by ID order)
        for (let i = entryIndex; i < allEntries.length; i++) {
          const currentEntry = allEntries[i];
          const newBalance = Number(currentEntry.balance) + balanceDifference;
          
          await db
            .updateTable('office_accounts')
            .set({
              balance: newBalance
            })
            .where('id', '=', currentEntry.id)
            .execute();
          
          // Update the balance in our local entry if it's the one we're returning
          if (currentEntry.id === id) {
            updatedEntry.balance = newBalance;
          }
        }
      }
    }
    
    // Get the updated entry with correct balance
    const finalEntry = await db
      .selectFrom('office_accounts')
      .select(['id', 'employee_name', 'date', 'detail', 'credit', 'debit', 'balance'])
      .where('id', '=', id)
      .executeTakeFirst();
    
    // Format output
    return {
      id: finalEntry.id,
      employee_name: finalEntry.employee_name,
      date: finalEntry.date,
      detail: finalEntry.detail,
      credit: Number(finalEntry.credit),
      debit: Number(finalEntry.debit),
      balance: Number(finalEntry.balance)
    };
  } catch (error) {
    console.error('Error updating entry:', error);
    throw error;
  }
};

export const deleteEntry = async (id: number, db: any) => {
  try {
    // First get the entry to be deleted
    const existingEntry = await db
      .selectFrom('office_accounts')
      .select(['id', 'bank_name', 'credit', 'debit'])
      .where('id', '=', id)
      .executeTakeFirst();
    
    if (!existingEntry) {
      return null; // Entry not found
    }
    
    // Calculate the balance impact of this entry
    const balanceImpact = Number(existingEntry.credit) - Number(existingEntry.debit);
    
    // Get all entries for the bank in ID order (to maintain original order)
    const allEntries = await db
      .selectFrom('office_accounts')
      .select(['id', 'balance'])
      .where('bank_name', '=', existingEntry.bank_name)
      .orderBy('id', 'asc') // Order by ID instead of date
      .execute();
    
    // Find the index of the entry to be deleted
    const entryIndex = allEntries.findIndex(entry => entry.id === id);
    
    if (entryIndex !== -1) {
      // Delete the entry
      await db
        .deleteFrom('office_accounts')
        .where('id', '=', id)
        .execute();
      
      // Update balances for all subsequent entries (by ID order)
      for (let i = entryIndex + 1; i < allEntries.length; i++) {
        const currentEntry = allEntries[i];
        const newBalance = Number(currentEntry.balance) - balanceImpact;
        
        await db
          .updateTable('office_accounts')
          .set({
            balance: newBalance
          })
          .where('id', '=', currentEntry.id)
          .execute();
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting entry:', error);
    throw error;
  }
};