import app from '../app';
import { createService, getServices, getServiceById, updateService, deleteService } from '../services/services';


app.post('/services', async (c) => {
  try {
    const body = await c.req.json();
    const result = await createService(body, globalThis.env.DB);
    return c.json(result, result.code);
  } catch (error) {
    console.error('Error creating service:', error);
    return c.json({ status: 'error', message: 'Failed to create service' }, 500);
  }
});


app.get('/services', async (c) => {
  try {
    const result = await getServices(globalThis.env.DB);
    return c.json(result, result.code);
  } catch (error) {
    console.error('Error fetching services:', error);
    return c.json({ status: 'error', message: 'Failed to fetch services' }, 500);
  }
});


app.get('/services/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await getServiceById(parseInt(id), globalThis.env.DB);
    return c.json(result, result.code);
  } catch (error) {
    console.error('Error fetching service:', error);
    return c.json({ status: 'error', message: 'Failed to fetch service' }, 500);
  }
});


app.put('/services/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = await updateService(parseInt(id), body, globalThis.env.DB);
    return c.json(result, result.code);
  } catch (error) {
    console.error('Error updating service:', error);
    return c.json({ status: 'error', message: 'Failed to update service' }, 500);
  }
});


app.delete('/services/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await deleteService(parseInt(id), globalThis.env.DB);
    return c.json(result, result.code);
  } catch (error) {
    console.error('Error deleting service:', error);
    return c.json({ status: 'error', message: 'Failed to delete service' }, 500);
  }
});