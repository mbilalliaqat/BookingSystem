export const createVendor = async (body: any, db: any) => {
  try {
    if (!body.vender_name) {
      return {
        status: 'error',
        code: 400,
        message: 'Vendor name is required'
      }
    }

    // Parse and validate credit/debit values first
    let credit = 0;
    let debit = 0;

    if (body.credit !== undefined && body.credit !== null && body.credit !== '') {
      const creditValue = Number(body.credit);
      if (!isNaN(creditValue) && creditValue > 0) {
        credit = creditValue;
      }
    }
    
    if (body.debit !== undefined && body.debit !== null && body.debit !== '') {
      const debitValue = Number(body.debit);
      if (!isNaN(debitValue) && debitValue > 0) {
        debit = debitValue;
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

    // Get the current balance for this vendor
    let currentBalance = 0;
    const latestRecord = await db
      .selectFrom('vender')
      .select('remaining_amount')
      .where('vender_name', '=', body.vender_name)
      .orderBy('date', 'desc')
      .orderBy('id', 'desc')
      .limit(1)
      .executeTakeFirst();

    if (latestRecord) {
      currentBalance = Number(latestRecord.remaining_amount) || 0;
    }

    // Calculate new balance: current + credit - debit
    const newBalance = currentBalance + credit - debit;

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
    }

  } catch (error) {
    console.error('Error creating vendor entry:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to create vendor transaction',
      errors: error.message
    };
  }
}

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
      .orderBy('date', 'asc')
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

    // Store the old credit and debit values for balance adjustment
    const oldCredit = Number(existingVendor.credit) || 0;
    const oldDebit = Number(existingVendor.debit) || 0;

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
    } else {
      credit = oldCredit;
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
    } else {
      debit = oldDebit;
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

    // Calculate the difference in balance change
    const oldBalance = oldCredit - oldDebit;
    const newBalance = credit - debit;
    const balanceDifference = newBalance - oldBalance;

    // Update the current entry (without changing remaining_amount yet)
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

    // Update remaining amounts for this entry and all subsequent entries
    await updateSubsequentBalances(updatedVendor.vender_name, id, balanceDifference, db);

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
    const deletedCredit = Number(existingVendor.credit) || 0;
    const deletedDebit = Number(existingVendor.debit) || 0;
    const balanceChange = deletedCredit - deletedDebit;

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

    // Update subsequent entries by subtracting the deleted entry's balance impact
    await updateSubsequentBalancesAfterDelete(vendorName, id, balanceChange, db);

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

// Helper function to update balances for the updated entry and all subsequent entries
const updateSubsequentBalances = async (vendorName: string, updatedId: number, balanceDifference: number, db: any) => {
  try {
    // Get all entries for this vendor that are equal to or after the updated entry
    // Order by date and id to maintain chronological order
    const entriesToUpdate = await db
      .selectFrom('vender')
      .select(['id', 'remaining_amount', 'date'])
      .where('vender_name', '=', vendorName)
      .where('id', '>=', updatedId)
      .orderBy('date', 'asc')
      .orderBy('id', 'asc')
      .execute();

    // Update each entry's remaining_amount
    for (const entry of entriesToUpdate) {
      const newRemainingAmount = Number(entry.remaining_amount) + balanceDifference;
      
      await db
        .updateTable('vender')
        .set({ remaining_amount: newRemainingAmount })
        .where('id', '=', entry.id)
        .execute();
    }
  } catch (error) {
    console.error('Error updating subsequent balances:', error);
    throw error;
  }
};

// Helper function to update balances after deletion
const updateSubsequentBalancesAfterDelete = async (vendorName: string, deletedId: number, balanceChange: number, db: any) => {
  try {
    // Get all entries for this vendor that come after the deleted entry
    const entriesToUpdate = await db
      .selectFrom('vender')
      .select(['id', 'remaining_amount', 'date'])
      .where('vender_name', '=', vendorName)
      .where('id', '>', deletedId)
      .orderBy('date', 'asc')
      .orderBy('id', 'asc')
      .execute();

    // Update each subsequent entry's remaining_amount by subtracting the deleted entry's impact
    for (const entry of entriesToUpdate) {
      const newRemainingAmount = Number(entry.remaining_amount) - balanceChange;
      
      await db
        .updateTable('vender')
        .set({ remaining_amount: newRemainingAmount })
        .where('id', '=', entry.id)
        .execute();
    }
  } catch (error) {
    console.error('Error updating balances after deletion:', error);
    throw error;
  }
};

// This function is kept for backward compatibility but not used in update/delete
const recalculateVendorBalances = async (vendorName: string, db: any) => {
  try {
    // Get all entries for this vendor in chronological order
    const allEntries = await db
      .selectFrom('vender')
      .select(['id', 'credit', 'debit', 'date'])
      .where('vender_name', '=', vendorName)
      .orderBy('date', 'asc')
      .orderBy('id', 'asc')
      .execute();

    let runningBalance = 0;
    
    // Process each entry in chronological order
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