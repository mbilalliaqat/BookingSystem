import app from '../app';
import { getArchivedRecords, restoreRecord } from '../services/archive';

// Get archived records for any module
app.get('/archive/:moduleName', async (c) => {
  const moduleName = c.req.param('moduleName');
  const result = await getArchivedRecords(moduleName, globalThis.env.DB);
  return c.json(result, result.code);
});

// Restore archived record
app.post('/archive/:id/restore', async (c) => {
  const archiveId = parseInt(c.req.param('id'));
  const result = await restoreRecord(archiveId, globalThis.env.DB);
  return c.json(result, result.code);
});

// Permanent delete from archive
app.delete('/archive/:id', async (c) => {
  const archiveId = parseInt(c.req.param('id'));
  // Delete from archived_data table permanently
});