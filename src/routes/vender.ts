import app from '../app';
import {createVendor, getVendor, getVendorByName, updateVendor, deleteVendor, getExistingVendorNames} from '../services/vender/index';

app.post('/vender', async (c) => {
    try {
        const body = await c.req.json();
        const result = await createVendor(body, globalThis.env.DB);
        return c.json(result);
    } catch (error) {
        console.error('Error creating vendor record:', error);
        return c.json({ status: 'error', message: 'Failed to create vendor record' }, 500);
    }
});

app.get('/vender', async (c) => {
    try {
        const result = await getVendor(globalThis.env.DB);
        return c.json(result);
    } catch (error) {
        console.error('Error fetching vendor records:', error);
        return c.json({ status: 'error', message: 'Failed to fetch vendor records' }, 500);
    }
});

app.get('/vender/:vender_name', async (c) => {
    try {
        const vender_name = c.req.param('vender_name');
        const result = await getVendorByName(vender_name, globalThis.env.DB);
        return c.json(result);
    } catch (error) {
        console.error('Error fetching vendor records:', error);
        return c.json({ status: 'error', message: 'Failed to fetch vendor records' }, 500);
    }
});

app.put('/vender/:id', async (c) => {
    try {
        const id = Number(c.req.param('id'));
        const body = await c.req.json();
        const result = await updateVendor(id, body, globalThis.env.DB);
        return c.json(result);
    } catch (error) {
        console.error('Error updating vendor record:', error);
        return c.json({ status: 'error', message: 'Failed to update vendor record' }, 500);
    }
});

app.delete('/vender/:id', async (c) => {
    try {
        const id = Number(c.req.param('id'));
        const deletedBy = c.req.header('X-User-Name') || 'system';
        const result = await deleteVendor(id, globalThis.env.DB, deletedBy);
        return c.json(
            {
                status: result.status,
                message: result.message,
                ...(result.vendor && { vendor: result.vendor }),
                ...(result.errors && { errors: result.errors }),
            },
            result.code
        );
    } catch (error) {
        console.error('Error deleting vendor record:', error);
        return c.json({ status: 'error', message: 'Failed to delete vendor record' }, 500);
    }
});

app.get('/vender-names/existing', async (c) => {
    try {
        const result = await getExistingVendorNames(globalThis.env.DB);
        return c.json(result);
    } catch (error) {
        console.error('Error fetching vendor names:', error);
        return c.json({ status: 'error', message: 'Failed to fetch vendor names' }, 500);
    }
});