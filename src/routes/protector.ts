import app from '../app';
import { createProtector, getProtectors, updateProtector, deleteProtector } from '../services/protector';

app.post('/protector', async (c) => {
  try {
    const body = await c.req.json();
    const result = await createProtector(body,globalThis.env.DB);
    return c.json(result, result.code);
  } catch (error) {
    console.error('Error creating protector:', error);
    return c.json({ status: 'error', message: 'Failed to create protector' }, 500);
  }
});

app.get('/protector', async (c) => {
  try {
    const result = await getProtectors(globalThis.env.DB);
    return c.json(result, result.code);
  } catch (error) {
    console.error('Error fetching protectors:', error);
    return c.json({ status: 'error', message: 'Failed to fetch protectors' }, 500);
  }
});

app.put('/protector/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    const result = await updateProtector(id, body,globalThis.env.DB);
    return c.json(result, result.code);
  } catch (error) {
    console.error('Error updating protector:', error);
    return c.json({ status: 'error', message: 'Failed to update protector' }, 500);
  }
});

app.delete('/protector/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const result = await deleteProtector(id,globalThis.env.DB);
    return c.json(result, result.code);
  } catch (error) {
    console.error('Error deleting protector:', error);
    return c.json({ status: 'error', message: 'Failed to delete protector' }, 500);
  }
});