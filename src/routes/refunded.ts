import app from '../app';
import { createRefunded, getRefunded, updateRefunded, deleteRefunded } from '../services/refunded';

app.post('/refunded', async (c) => {
  try {
    const body = await c.req.json();
    const result = await createRefunded(body, globalThis.env.DB);
    return c.json(result, result.code);
  } catch (error) {
    console.error('Error creating refunded record:', error);
    return c.json({ status: 'error', message: 'Failed to create refunded record' }, 500);
  }
});

app.get('/refunded', async (c) => {
  try {
    const result = await getRefunded(globalThis.env.DB);
    return c.json(result, result.code);
  } catch (error) {
    console.error('Error fetching refunded records:', error);
    return c.json({ status: 'error', message: 'Failed to fetch refunded records' }, 500);
  }
});

app.put('/refunded/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    const result = await updateRefunded(id, body, globalThis.env.DB);
    return c.json(result, result.code);
  } catch (error) {
    console.error('Error updating refunded record:', error);
    return c.json({ status: 'error', message: 'Failed to update refunded record' }, 500);
  }
});

app.delete('/refunded/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const deletedBy = c.req.header('X-User-Name') || 'system';
    const result = await deleteRefunded(id, globalThis.env.DB, deletedBy);
    return c.json(
      {
        status: result.status,
        message: result.message,
        ...(result.refunded && { refunded: result.refunded }),
        ...(result.errors && { errors: result.errors }),
      },
      result.code
    );
  } catch (error) {
    console.error('Error deleting refunded record:', error);
    return c.json({ status: 'error', message: 'Failed to delete refunded record' }, 500);
  }
});