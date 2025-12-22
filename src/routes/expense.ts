import app from '../app';
import { createExpense, getExpenses, getExpenseById, updateExpense, deleteExpense } from '../services/expense';

// Create a new expense
app.post('/expenses', async (c) => {
  try {
    const body = await c.req.json();
    const result = await createExpense(body, globalThis.env.DB);
    return c.json(result, result.code);
  } catch (error) {
    console.error('Error creating expense:', error);
    return c.json({ status: 'error', message: 'Failed to create expense' }, 500);
  }
});

// Get all expenses
app.get('/expenses', async (c) => {
  try {
    const result = await getExpenses(globalThis.env.DB);
    return c.json(result, result.code);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return c.json({ status: 'error', message: 'Failed to fetch expenses' }, 500);
  }
});

// Get an expense by ID
app.get('/expenses/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await getExpenseById(parseInt(id), globalThis.env.DB);
    return c.json(result, result.code);
  } catch (error) {
    console.error('Error fetching expense:', error);
    return c.json({ status: 'error', message: 'Failed to fetch expense' }, 500);
  }
});

// Update an expense
app.put('/expenses/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = await updateExpense(parseInt(id), body, globalThis.env.DB);
    return c.json(result, result.code);
  } catch (error) {
    console.error('Error updating expense:', error);
    return c.json({ status: 'error', message: 'Failed to update expense' }, 500);
  }
});

// Delete an expense
app.delete('/expenses/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const deletedBy = c.req.header('X-User-Name') || 'system';
    const result = await deleteExpense(parseInt(id), globalThis.env.DB, deletedBy);
    return c.json(
      {
        status: result.status,
        message: result.message,
        ...(result.expense && { expense: result.expense }),
        ...(result.errors && { errors: result.errors }),
      },
      result.code
    );
  } catch (error) {
    console.error('Error deleting expense:', error);
    return c.json({ status: 'error', message: 'Failed to delete expense' }, 500);
  }
});