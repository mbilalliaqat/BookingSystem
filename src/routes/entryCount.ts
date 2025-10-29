// backend/src/routes/entryCount.ts

import app from '../app';
import { incrementEntryCounts, getEntryCounts } from '../services/counters';

app.get('/api/entry/counts', async (c) => {
  try {
    const db = globalThis.env.DB;
    const result = await getEntryCounts(db);
    console.log('Fetched entry counts via /api/entry/counts:', JSON.stringify(result, null, 2));
    return c.json(result, result.code);
  } catch (error: any) {
    console.error('Error fetching entry counts via route:', error);
    return c.json({ status: 'error', message: 'Failed to fetch entry counts' }, 500);
  }
});

app.post('/api/entry/increment', async (c) => {
  try {
    // Destructure actualEntryNumber from the request body
    const { formType, actualEntryNumber } = await c.req.json();
    
    // Validate inputs
    if (!formType || typeof actualEntryNumber === 'undefined') {
      return c.json({ status: 'error', message: 'formType and actualEntryNumber are required' }, 400);
    }
    
    const db = globalThis.env.DB;
    // Pass actualEntryNumber to the service function
    const result = await incrementEntryCounts(formType, actualEntryNumber, db);
    console.log(`Increment entry result for /api/entry/increment: formType=${formType}, actualEntryNumber=${actualEntryNumber}, result=${JSON.stringify(result, null, 2)}`);
    return c.json(result, result.code);
  } catch (error: any) {
    console.error('Error updating entry counts via route:', error);
    return c.json({ status: 'error', message: 'Failed to update entry counts' }, 500);
  }
});