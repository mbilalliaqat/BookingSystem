import app from '../app';
import { createEntry, getEntriesByBank, getBanks,  updateEntry, deleteEntry } from '../services/accountsRecord';

// Create a new entry (handles both credit and debit)
app.post('/accounts', async (c) => {
  try {
    const body = await c.req.json();
    const result = await createEntry(body, globalThis.env.DB);
    return c.json(result, 201);
  } catch (error) {
    console.error('Error:', error);
    return c.json({ message: 'Failed to create entry' }, 500);
  }
});

// Get all entries for a bank
app.get('/accounts/:bankName', async (c) => {
  try {
    const bankName = c.req.param('bankName');
    const entries = await getEntriesByBank(bankName, globalThis.env.DB);
    return c.json(entries, 200);
  } catch (error) {
    console.error('Error:', error);
    return c.json({ message: 'Failed to get entries' }, 500);
  }
});

// Get list of banks
app.get('/accounts', async (c) => {
  try {
    const banks = await getBanks(globalThis.env.DB);
    return c.json(banks, 200);
  } catch (error) {
    console.error('Error:', error);
    return c.json({ message: 'Failed to get banks' }, 500);
  }
});

app.put('/accounts/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = await updateEntry(parseInt(id), body, globalThis.env.DB);
    
    if (!result) {
      return c.json({ message: 'Entry not found' }, 404);
    }
    
    return c.json(result, 200);
  } catch (error) {
    console.error('Error updating entry:', error);
    return c.json({ message: 'Failed to update entry' }, 500);
  }
});

// Delete an entry
app.delete('/accounts/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const deletedBy = c.req.header('X-User-Name') || 'system';
    const result = await deleteEntry(parseInt(id), globalThis.env.DB, deletedBy);
    
    if (!result) {
      return c.json({ message: 'Entry not found' }, 404);
    }
    
    return c.json({ message: 'Entry archived and deleted successfully', deletedEntry: result }, 200);
  } catch (error) {
    console.error('Error deleting entry:', error);
    return c.json({ message: 'Failed to delete entry' }, 500);
  }
});