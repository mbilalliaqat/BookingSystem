import { incrementEntryCounts } from "../counters";
import { archiveRecord } from '../archive';

export const createExpense = async (body: any, db: any) => {
  try {
    const now = new Date();
    const [currentEntryNumber] = body.entry.split('/').map(Number);

    // Handle opening balance mode
    let withdrawAmount = body.withdraw;
    let totalAmount = body.total_amount;
    let selectionType = body.selection;

    // If cash_office field exists (opening balance mode)
    if (body.cash_office !== undefined && body.cash_office !== null) {
      const cashOfficeValue = parseFloat(body.cash_office);
      
      // Set selection to OPENING BALANCE
      selectionType = 'OPENING BALANCE';
      totalAmount = 0;
      
      // If negative, it's a withdraw; if positive, it's added to cash
      if (cashOfficeValue < 0) {
        withdrawAmount = Math.abs(cashOfficeValue);
      } else {
        withdrawAmount = 0;
      }
    }

    const newExpense = await db
      .insertInto('expense')
      .values({
        user_name: body.user_name,
        entry: body.entry,
        date: body.date,
        detail: body.detail,
        total_amount: totalAmount,
        selection: selectionType,
        withdraw: withdrawAmount,
        vendor_name: body.vendor_name,
        cash_office: body.cash_office !== undefined ? parseFloat(body.cash_office) : null,
        createdAt: now
      })
      .returningAll()
      .executeTakeFirst();

    if (newExpense) {
      await incrementEntryCounts('expense', currentEntryNumber, db);
      
      // If withdraw amount exists and vendor_name is provided, create vendor transaction
      // Don't create vendor transaction for opening balance entries
      if (withdrawAmount && parseFloat(withdrawAmount) > 0 && body.vendor_name && selectionType !== 'OPENING BALANCE') {
        try {
          await db
            .insertInto('vender')
            .values({
              vender_name: body.vendor_name,
              detail: `Expense - ${body.detail}`,
              debit: parseFloat(withdrawAmount) || 0,
              credit: null,
              date: body.date,
              entry: body.entry,
              bank_title: null,
              createdAt: now
            })
            .execute();
        } catch (vendorError) {
          console.error('Error creating vendor transaction:', vendorError);
        }
      }
    }

    return {
      status: 'success',
      code: 201,
      message: 'Expense created successfully',
      expense: newExpense
    };
  } catch (error) {
    console.error('Error in createExpense:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to create expense',
      errors: error.message
    };
  }
};

export const getExpenses = async (db: any) => {
  try {
    const expenses = await db
      .selectFrom('expense')
      .selectAll()
      .execute();

    return {
      status: 'success',
      code: 200,
      expenses: expenses
    };
  } catch (error) {
    console.error('Error in getExpenses:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch expenses',
      errors: error.message
    };
  }
};

export const getExpenseById = async (id: number, db: any) => {
  try {
    const expense = await db
      .selectFrom('expense')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!expense) {
      return {
        status: 'error',
        code: 404,
        message: 'Expense not found'
      };
    }

    return {
      status: 'success',
      code: 200,
      expense: expense
    };
  } catch (error) {
    console.error('Error in getExpenseById:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch expense',
      errors: error.message
    };
  }
};

export const updateExpense = async (id: number, body: any, db: any) => {
  try {
    const now = new Date();
    
    // First, get the old expense to check if we need to update vendor transactions
    const oldExpense = await db
      .selectFrom('expense')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!oldExpense) {
      return {
        status: 'error',
        code: 404,
        message: 'Expense not found'
      };
    }

    // Handle opening balance mode for updates
    let withdrawAmount = body.withdraw;
    let totalAmount = body.total_amount;
    let selectionType = body.selection;

    if (body.cash_office !== undefined && body.cash_office !== null) {
      const cashOfficeValue = parseFloat(body.cash_office);
      selectionType = 'OPENING BALANCE';
      totalAmount = 0;
      
      if (cashOfficeValue < 0) {
        withdrawAmount = Math.abs(cashOfficeValue);
      } else {
        withdrawAmount = 0;
      }
    }

    const updatedExpense = await db
      .updateTable('expense')
      .set({
        user_name: body.user_name,
        entry: body.entry,
        date: body.date,
        detail: body.detail,
        total_amount: totalAmount,
        selection: selectionType,
        withdraw: withdrawAmount,
        vendor_name: body.vendor_name,
        cash_office: body.cash_office !== undefined ? parseFloat(body.cash_office) : null,
        createdAt: now
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (updatedExpense) {
      // Delete old vendor transaction if it exists
      if (oldExpense.vendor_name && oldExpense.entry) {
        try {
          await db
            .deleteFrom('vender')
            .where('entry', '=', oldExpense.entry)
            .where('vender_name', '=', oldExpense.vendor_name)
            .where('detail', 'like', `Expense - ${oldExpense.detail}%`)
            .execute();
        } catch (deleteError) {
          console.error('Error deleting old vendor transaction:', deleteError);
        }
      }

      // Create new vendor transaction if needed (not for opening balance)
      if (withdrawAmount && parseFloat(withdrawAmount) > 0 && body.vendor_name && selectionType !== 'OPENING BALANCE') {
        try {
          await db
            .insertInto('vender')
            .values({
              vender_name: body.vendor_name,
              detail: `Expense - ${body.detail}`,
              debit: parseFloat(withdrawAmount) || 0,
              credit: null,
              date: body.date,
              entry: body.entry,
              bank_title: null,
              createdAt: now
            })
            .execute();
        } catch (vendorError) {
          console.error('Error creating vendor transaction:', vendorError);
        }
      }
    }

    return {
      status: 'success',
      code: 200,
      message: 'Expense updated successfully',
      expense: updatedExpense
    };
  } catch (error) {
    console.error('Error in updateExpense:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to update expense',
      errors: error.message
    };
  }
};

export const deleteExpense = async (id: number, db: any, deletedBy: string = 'system') => {
  try {
    // First get the expense to find associated vendor transactions
    const expense = await db
      .selectFrom('expense')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!expense) {
      return {
        status: 'error',
        code: 404,
        message: 'Expense not found'
      };
    }

    // Fetch associated vendor transactions (for archiving)
    let vendorTxns: any[] = [];
    if (expense.vendor_name && expense.entry) {
      try {
        vendorTxns = await db
          .selectFrom('vender')
          .selectAll()
          .where('entry', '=', expense.entry)
          .where('vender_name', '=', expense.vendor_name)
          .where('detail', 'like', `Expense - ${expense.detail}%`)
          .execute();
      } catch (vendorFetchError) {
        console.error('Error fetching vendor transactions for archive:', vendorFetchError);
      }
    }

    // Archive expense and related vendor transactions
    const archiveResult = await archiveRecord('expense', id, { expense, vendorTxns }, db, deletedBy);

    if (archiveResult.status !== 'success') {
      return { status: 'error', code: 500, message: 'Failed to archive expense', errors: archiveResult.message };
    }

    // Delete associated vendor transaction if exists
    if (expense.vendor_name && expense.entry) {
      try {
        await db
          .deleteFrom('vender')
          .where('entry', '=', expense.entry)
          .where('vender_name', '=', expense.vendor_name)
          .where('detail', 'like', `Expense - ${expense.detail}%`)
          .execute();
      } catch (vendorError) {
        console.error('Error deleting vendor transaction:', vendorError);
      }
    }

    // Delete the expense
    const deletedExpense = await db
      .deleteFrom('expense')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    return {
      status: 'success',
      code: 200,
      message: 'Expense archived and deleted successfully',
      expense: deletedExpense
    };
  } catch (error: any) {
    console.error('Error in deleteExpense:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to delete expense',
      errors: error.message
    };
  }
};