export const createVendor = async (body: any, db: any) => {
  try {
    if (!body.vender_name) {
      return {
        status: 'error',
        code: 400,
        message: 'Vendor name is required'
      }
    }

    // Get the previous balance for this vendor
    let previousBalance = 0;
    const latestRecord = await db
      .selectFrom('vender')
      .select('remaining_amount')
      .where('vender_name', '=', body.vender_name)
      .orderBy('id', 'desc')
      .limit(1)
      .executeTakeFirst();

    if (latestRecord) {
      previousBalance = Number(latestRecord.remaining_amount);
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

    // Prevent both credit and debit in same transaction
    if (credit > 0 && debit > 0) {
      return {
        status: 'error',
        code: 400,
        message: 'Cannot have both credit and debit in the same transaction'
      }
    }

    const newVendor = await db
      .insertInto('vender')
      .values({
        vender_name: body.vender_name,
        date: body.date,
        bank_title: body.bank_title,
        entry: body.entry,
        detail: body.detail,
        credit: credit || null,
        debit: debit || null,
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

    // Get all entries for the vendor in chronological order
    const allEntries = await db
      .selectFrom('vender')
      .select(['id', 'credit', 'debit', 'remaining_amount'])
      .where('vender_name', '=', existingVendor.vender_name)
      .orderBy('date', 'asc')
      .orderBy('id', 'asc')
      .execute();

    // Calculate new credit and debit values
    let credit = 0;
    let debit = 0;

    if (body.credit !== undefined) {
      if (Number(body.credit) > 0) {
        credit = Number(body.credit);
      }
    } else {
      credit = Number(existingVendor.credit) || 0;
    }

    if (body.debit !== undefined) {
      if (Number(body.debit) > 0) {
        debit = Number(body.debit);
      }
    } else {
      debit = Number(existingVendor.debit) || 0;
    }

    // Prevent both credit and debit in same transaction
    if (credit > 0 && debit > 0) {
      return {
        status: 'error',
        code: 400,
        message: 'Cannot have both credit and debit in the same transaction'
      }
    }

    // Calculate the difference in balance this change will cause
    const oldContribution = Number(existingVendor.credit) - Number(existingVendor.debit);
    const newContribution = credit - debit;
    const balanceDifference = newContribution - oldContribution;

    // Update the current entry
    const updatedVendor = await db
      .updateTable('vender')
      .set({
        vender_name: body.vender_name || existingVendor.vender_name,
        date: body.date || existingVendor.date,
        bank_title: body.bank_title || existingVendor.bank_title,
        entry: body.entry || existingVendor.entry,
        detail: body.detail || existingVendor.detail,
        credit: credit || null,
        debit: debit || null,
        // Don't update remaining_amount here, we'll do it separately for all affected entries
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

    // Update balances for all entries from this point forward
    if (balanceDifference !== 0) {
      // Find the index of the updated entry
      const entryIndex = allEntries.findIndex(entry => entry.id === id);

      if (entryIndex !== -1) {
        // Update balances for all subsequent entries (including current one)
        for (let i = entryIndex; i < allEntries.length; i++) {
          const currentEntry = allEntries[i];
          const newBalance = Number(currentEntry.remaining_amount) + balanceDifference;

          await db
            .updateTable('vender')
            .set({
              remaining_amount: newBalance
            })
            .where('id', '=', currentEntry.id)
            .execute();

          // Update the balance in our local entry if it's the one we're returning
          if (currentEntry.id === id) {
            updatedVendor.remaining_amount = newBalance;
          }
        }
      }
    }

    // Get the updated entry with correct balance
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
      .select(['id', 'vender_name', 'credit', 'debit'])
      .where('id', '=', id)
      .executeTakeFirst();

    if (!existingVendor) {
      return {
        status: 'error',
        code: 404,
        message: 'Vendor record not found'
      };
    }

    // Calculate the balance impact of this entry
    const balanceImpact = Number(existingVendor.credit) - Number(existingVendor.debit);

    // Get all entries for the vendor in chronological order
    const allEntries = await db
      .selectFrom('vender')
      .select(['id', 'remaining_amount'])
      .where('vender_name', '=', existingVendor.vender_name)
      .orderBy('date', 'asc')
      .orderBy('id', 'asc')
      .execute();

    // Find the index of the entry to be deleted
    const entryIndex = allEntries.findIndex(entry => entry.id === id);

    if (entryIndex !== -1) {
      // Delete the entry
      const deletedVendor = await db
        .deleteFrom('vender')
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();

      // Update balances for all subsequent entries
      for (let i = entryIndex + 1; i < allEntries.length; i++) {
        const currentEntry = allEntries[i];
        const newBalance = Number(currentEntry.remaining_amount) - balanceImpact;

        await db
          .updateTable('vender')
          .set({
            remaining_amount: newBalance
          })
          .where('id', '=', currentEntry.id)
          .execute();
      }

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
    }

    return {
      status: 'error',
      code: 500,
      message: 'Failed to delete vendor record'
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