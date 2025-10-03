import { incrementEntryCounts } from "../counters";


export const createExpense = async (body: any, db: any) => {
  try {
    const now = new Date();
    const [currentEntryNumber] = body.entry.split('/').map(Number);

    const newExpense = await db
      .insertInto('expense')
      .values({
        user_name: body.user_name,
        entry: body.entry,
        date: body.date,
        detail: body.detail,
        total_amount: body.total_amount,
        selection: body.selection,
        withdraw:body.withdraw,
        createdAt: now
      })
      .returningAll()
      .executeTakeFirst();

       if (newExpense) {
            await incrementEntryCounts('expense', currentEntryNumber, db); // Update entry_counters table
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
    const updatedExpense = await db
      .updateTable('expense')
      .set({
        user_name: body.user_name,
        entry: body.entry,
        date: body.date,
        detail: body.detail,
        total_amount: body.total_amount,
        selection: body.selection,
        withdraw:body.withdraw,
        createdAt: now
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!updatedExpense) {
      return {
        status: 'error',
        code: 404,
        message: 'Expense not found'
      };
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

export const deleteExpense = async (id: number, db: any) => {
  try {
    const deletedExpense = await db
      .deleteFrom('expense')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!deletedExpense) {
      return {
        status: 'error',
        code: 404,
        message: 'Expense not found'
      };
    }

    return {
      status: 'success',
      code: 200,
      message: 'Expense deleted successfully',
      expense: deletedExpense
    };
  } catch (error) {
    console.error('Error in deleteExpense:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to delete expense',
      errors: error.message
    };
  }
};