import app from '../app';
import { createService, getServices, getServiceById, updateService, deleteService, createServicePayment, getServicePaymentsByServiceId, updateServicePayment, deleteServicePayment } from '../services/services';


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
    const deletedBy = c.req.header('X-User-Name') || 'system';
    const result = await deleteService(parseInt(id), globalThis.env.DB, deletedBy);
    return c.json(
      {
        status: result.status,
        message: result.message,
        ...(result.data && { data: result.data }),
        ...(result.errors && { errors: result.errors }),
      },
      result.code
    );
  } catch (error) {
    console.error('Error deleting service:', error);
    return c.json({ status: 'error', message: 'Failed to delete service' }, 500);
  }
});

// Service payment routes
app.post('/services/:id/payments', async (c) => {
  try {
    const serviceId = Number(c.req.param('id'));
    if (isNaN(serviceId)) return c.json({ status: 'error', code: 400, message: 'Invalid service ID' }, 400);

    const body = await c.req.json();
    const payload = { ...body, service_id: serviceId };
    const result = await createServicePayment(payload, globalThis.env.DB);

    return c.json(
      {
        status: result.status,
        message: result.message,
        ...(result.payment && { payment: result.payment }),
        ...(result.service && { service: result.service }),
        ...(result.errors && { errors: result.errors }),
      },
      result.code
    );
  } catch (error) {
    console.error('Error creating service payment:', error);
    return c.json({ status: 'error', message: 'Failed to create service payment' }, 500);
  }
});

app.get('/services/:id/payments', async (c) => {
  try {
    const serviceId = Number(c.req.param('id'));
    if (isNaN(serviceId)) return c.json({ status: 'error', code: 400, message: 'Invalid service ID' }, 400);

    const result = await getServicePaymentsByServiceId(serviceId, globalThis.env.DB);
    return c.json({ status: result.status, message: result.message, ...(result.payments && { payments: result.payments }) }, result.code);
  } catch (error) {
    console.error('Error fetching service payments:', error);
    return c.json({ status: 'error', message: 'Failed to fetch service payments' }, 500);
  }
});

app.put('/services/payment/:id', async (c) => {
  try {
    const paymentId = Number(c.req.param('id'));
    if (isNaN(paymentId)) return c.json({ status: 'error', code: 400, message: 'Invalid payment ID' }, 400);

    const body = await c.req.json();
    const result = await updateServicePayment(paymentId, body, globalThis.env.DB);

    return c.json({ status: result.status, message: result.message, ...(result.payment && { payment: result.payment }), ...(result.errors && { errors: result.errors }) }, result.code);
  } catch (error) {
    console.error('Error updating service payment:', error);
    return c.json({ status: 'error', message: 'Failed to update service payment' }, 500);
  }
});

app.delete('/services/payment/:id', async (c) => {
  try {
    const paymentId = Number(c.req.param('id'));
    if (isNaN(paymentId)) return c.json({ status: 'error', code: 400, message: 'Invalid payment ID' }, 400);

    const result = await deleteServicePayment(paymentId, globalThis.env.DB);
    return c.json({ status: result.status, message: result.message, ...(result.payment && { payment: result.payment }), ...(result.errors && { errors: result.errors }) }, result.code);
  } catch (error) {
    console.error('Error deleting service payment:', error);
    return c.json({ status: 'error', message: 'Failed to delete service payment' }, 500);
  }
});