import app from '../app';
import { getArchivedRecords, restoreRecord, deleteArchivedRecord } from '../services/archive';

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
  const idParam = c.req.param('id');
  const archiveId = parseInt(idParam);
  if (Number.isNaN(archiveId)) {
    return c.json({ status: 'error', code: 400, message: 'Invalid archive id' }, 400);
  }
  try {
    const result = await deleteArchivedRecord(archiveId, globalThis.env.DB);
    return c.json(result, result.code ?? 200);
  } catch (error) {
    return c.json({ status: 'error', code: 500, message: error.message }, 500);
  }
});