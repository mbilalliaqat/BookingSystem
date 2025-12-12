import { incrementEntryCounts } from "../counters";

export const createVendor = async (body: any, db: any) => {
  try {
    const [currentEntryNumber] = body.entry.split('/').map(Number);

    if (!body.vender_name) {
      return {
        status: 'error',
        code: 400,
        message: 'Vendor name is required'
      };
    }

    // Parse credit and debit values
    let credit = 0;
    let debit = 0;

    if (body.credit !== undefined && body.credit !== null && body.credit !== '') {
      const creditValue = Number(body.credit);
      if (!isNaN(creditValue)) {
        credit = creditValue;
      }
    }

    if (body.debit !== undefined && body.debit !== null && body.debit !== '') {
      const debitValue = Number(body.debit);
      if (!isNaN(debitValue)) {
        debit = debitValue;
      }
    }

    // Detect if this is an Opening Balance entry
    // Opening balance entries can have credit/debit = 0 (or null)
const isOpeningBalance = (credit === 0 && debit === 0) && (body.balance !== undefined || body.balance === 0);

    // Validation for normal transactions (not opening balance)
    if (!isOpeningBalance && credit === 0 && debit === 0) {
      if (credit === 0 && debit === 0) {
        return {
          status: 'error',
          code: 400,
          message: 'Either credit or debit amount is required'
        };
      }

      if (credit > 0 && debit > 0) {
        return {
          status: 'error',
          code: 400,
          message: 'Cannot have both credit and debit in the same transaction'
        };
      }
    }

    // Calculate current balance for this vendor
    const currentBalance = await calculateCurrentBalance(body.vender_name, db);

    // Calculate new balance
    let newBalance = currentBalance + credit - debit;

    // If it's an opening balance entry, use the provided balance directly
    if (isOpeningBalance) {
      const openingBalance = parseFloat(body.balance) || 0;
      newBalance = openingBalance; // override with opening balance value
    }

    // Insert the new vendor transaction
    const newVendor = await db
      .insertInto('vender')
      .values({
        vender_name: body.vender_name,
        date: body.date,
        bank_title: body.bank_title || '',
        entry: body.entry || '',
        detail: body.detail || '',
        credit: credit > 0 ? credit : null,
        debit: debit > 0 ? debit : null,
        remaining_amount: newBalance
      })
      .returningAll()
      .executeTakeFirst();

    if (newVendor) {
      await incrementEntryCounts('vender', currentEntryNumber, db);

      // Recalculate all balances for this vendor to keep everything consistent
      await recalculateVendorBalances(body.vender_name, db);
    }

    return {
      status: 'success',
      code: 201,
      message: 'Vendor transaction created successfully',
      vendor: {
        id: newVendor.id,
        vender_name: newVendor.vender_name,
        date: newVendor.date,
        bank_title: newVendor.bank_title,
        entry: newVendor.entry,
        detail: newVendor.detail,
        credit: Number(newVendor.credit) || 0,
        debit: Number(newVendor.debit) || 0,
        remaining_amount: Number(newVendor.remaining_amount)
      }
    };

  } catch (error) {
    console.error('Error creating vendor entry:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to create vendor transaction',
      errors: error.message
    };
  }
};

export const getVendor = async (db: any) => {
  try {
    const vendors = await db
      .selectFrom('vender')
      .selectAll()
      .orderBy('id', 'desc')
      .execute();

    // Format output to ensure proper number formatting
    const formattedVendors = vendors.map(vendor => ({
      id: vendor.id,
      vender_name: vendor.vender_name,
      date: vendor.date,
      bank_title: vendor.bank_title,
      entry: vendor.entry,
      detail: vendor.detail,
      credit: Number(vendor.credit) || 0,
      debit: Number(vendor.debit) || 0,
      remaining_amount: Number(vendor.remaining_amount)
    }));

    return {
      status: 'success',
      code: 200,
      vendors: formattedVendors
    };
  } catch (error) {
    console.error('Error getting vendors:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch vendor records',
      errors: error.message
    };
  }
}

export const getVendorByName = async (vender_name: string, db: any) => {
  try {
    const vendors = await db
      .selectFrom('vender')
      .selectAll()
      .where('vender_name', '=', vender_name)
      .orderBy('id', 'asc')
      .execute();

    // Format output to ensure proper number formatting
    const formattedVendors = vendors.map(vendor => ({
      id: vendor.id,
      vender_name: vendor.vender_name,
      date: vendor.date,
      bank_title: vendor.bank_title,
      entry: vendor.entry,
      detail: vendor.detail,
      credit: Number(vendor.credit) || 0,
      debit: Number(vendor.debit) || 0,
      remaining_amount: Number(vendor.remaining_amount)
    }));

    return {
      status: 'success',
      code: 200,
      vendors: formattedVendors
    }
  } catch (error) {
    console.error('Error getting vendor:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch vendor records',
      errors: error.message
    };
  }
}

export const getExistingVendorNames = async (db: any) => {
  try {
    const vendorNames = await db 
     .selectFrom('vender')
     .select('vender_name')
     .distinct()
     .where('vender_name', 'is not', null)
     .where('vender_name', '!=', '')
     .orderBy('vender_name', 'asc')
    .execute();

    const formattedNames = vendorNames.map(item => item.vender_name);

      return {
      status: 'success',
      code: 200,
      vendorNames: formattedNames
    };
    
  }
  catch(error){
     console.error('Error getting vendor names:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch vendor names',
      errors: error.message
    };
  } 
}

export const updateVendor = async (id: number, body: any, db: any) => {
  try {
    // First get the entry to be updated
    const existingVendor = await db
      .selectFrom('vender')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!existingVendor) {
      return {
        status: 'error',
        code: 404,
        message: 'Vendor record not found'
      }
    }

    // Calculate new credit and debit values
    let credit = 0;
    let debit = 0;

    // Parse credit value
    if (body.credit !== undefined) {
      if (body.credit === null || body.credit === '' || body.credit === '0') {
        credit = 0;
      } else {
        const creditValue = Number(body.credit);
        if (!isNaN(creditValue) && creditValue > 0) {
          credit = creditValue;
        }
      }
    }

    // Parse debit value
    if (body.debit !== undefined) {
      if (body.debit === null || body.debit === '' || body.debit === '0') {
        debit = 0;
      } else {
        const debitValue = Number(body.debit);
        if (!isNaN(debitValue) && debitValue > 0) {
          debit = debitValue;
        }
      }
    }

    // Prevent both credit and debit in same transaction
    if (credit > 0 && debit > 0) {
      return {
        status: 'error',
        code: 400,
        message: 'Cannot have both credit and debit in the same transaction'
      }
    }

    // At least one of credit or debit should be provided
    if (credit === 0 && debit === 0) {
      return {
        status: 'error',
        code: 400,
        message: 'Either credit or debit amount is required'
      }
    }

    // Update the current entry
    const updatedVendor = await db
      .updateTable('vender')
      .set({
        vender_name: body.vender_name || existingVendor.vender_name,
        date: body.date || existingVendor.date,
        bank_title: body.bank_title !== undefined ? body.bank_title : existingVendor.bank_title,
        entry: body.entry !== undefined ? body.entry : existingVendor.entry,
        detail: body.detail !== undefined ? body.detail : existingVendor.detail,
        credit: credit > 0 ? credit : null,
        debit: debit > 0 ? debit : null,
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!updatedVendor) {
      return {
        status: 'error',
        code: 500,
        message: 'Failed to update vendor record'
      };
    }

    // Recalculate all balances for this vendor to ensure consistency
    await recalculateVendorBalances(updatedVendor.vender_name, db);

    // Get the updated entry with recalculated balance
    const finalVendor = await db
      .selectFrom('vender')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    return {
      status: 'success',
      code: 200,
      message: 'Vendor record updated successfully',
      vendor: {
        id: finalVendor.id,
        vender_name: finalVendor.vender_name,
        date: finalVendor.date,
        bank_title: finalVendor.bank_title,
        entry: finalVendor.entry,
        detail: finalVendor.detail,
        credit: Number(finalVendor.credit) || 0,
        debit: Number(finalVendor.debit) || 0,
        remaining_amount: Number(finalVendor.remaining_amount)
      }
    };

  } catch (error) {
    console.error('Error updating vendor:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to update vendor record',
      errors: error.message
    };
  }
}

export const deleteVendor = async (id: number, db: any) => {
  try {
    // First get the entry to be deleted
    const existingVendor = await db
      .selectFrom('vender')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!existingVendor) {
      return {
        status: 'error',
        code: 404,
        message: 'Vendor record not found'
      };
    }

    const vendorName = existingVendor.vender_name;

    // Delete the entry
    const deletedVendor = await db
      .deleteFrom('vender')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!deletedVendor) {
      return {
        status: 'error',
        code: 500,
        message: 'Failed to delete vendor record'
      };
    }

    // Recalculate all balances for this vendor to ensure consistency
    await recalculateVendorBalances(vendorName, db);

    return {
      status: 'success',
      code: 200,
      message: 'Vendor record deleted successfully',
      vendor: {
        id: deletedVendor.id,
        vender_name: deletedVendor.vender_name,
        date: deletedVendor.date,
        bank_title: deletedVendor.bank_title,
        entry: deletedVendor.entry,
        detail: deletedVendor.detail,
        credit: Number(deletedVendor.credit) || 0,
        debit: Number(deletedVendor.debit) || 0,
        remaining_amount: Number(deletedVendor.remaining_amount)
      }
    };

  } catch (error) {
    console.error('Error in deleteVendor:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to delete vendor record',
      errors: error.message
    };
  }
};

// Helper function to calculate current balance for a vendor
const calculateCurrentBalance = async (vendorName: string, db: any) => {
  try {
    // Get all entries for this vendor in ID order (creation order)
    const allEntries = await db
      .selectFrom('vender')
      .select(['credit', 'debit'])
      .where('vender_name', '=', vendorName)
      .orderBy('id', 'asc')
      .execute();

    let balance = 0;
    
    // Calculate running balance: add credit, subtract debit
    for (const entry of allEntries) {
      const entryCredit = Number(entry.credit) || 0;
      const entryDebit = Number(entry.debit) || 0;
      balance = balance + entryCredit - entryDebit;
    }

    return balance;
  } catch (error) {
    console.error('Error calculating current balance:', error);
    return 0;
  }
};

// Helper function to recalculate all balances for a vendor
const recalculateVendorBalances = async (vendorName: string, db: any) => {
  try {
    // Get all entries for this vendor in ID order (creation order)
    const allEntries = await db
      .selectFrom('vender')
      .select(['id', 'credit', 'debit', 'date'])
      .where('vender_name', '=', vendorName)
      .orderBy('id', 'asc')
      .execute();

    let runningBalance = 0;
    
    // Process each entry in ID order (creation order)
    for (const entry of allEntries) {
      const entryCredit = Number(entry.credit) || 0;
      const entryDebit = Number(entry.debit) || 0;
      
      // Calculate the running balance: add credit, subtract debit
      runningBalance = runningBalance + entryCredit - entryDebit;

      // Update the running balance for this entry
      await db
        .updateTable('vender')
        .set({ remaining_amount: runningBalance })
        .where('id', '=', entry.id)
        .execute();
    }
  } catch (error) {
    console.error('Error recalculating vendor balances:', error);
    throw error;
  }
};

// These helper functions are removed as they're replaced by the recalculateVendorBalances approach
// which is more reliable and ensures consistency

// Removed: updateSubsequentBalances
// Removed: updateSubsequentBalancesAfterDelete