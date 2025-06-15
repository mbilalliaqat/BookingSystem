import app from '../app';
import { createVender, getVender, getVenderById, updateVender, deleteVender } from '../services/vender';

const handleFileUpload = async (file: File) => {
  if (!file) return null;
  
  const timestamp = Date.now();
  const fileExtension = file.name.split('.').pop();
  const filename = `${timestamp}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
  
  try {
    return filename;
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error('Failed to upload file');
  }
};

app.post('/vender', async (c) => {
  try {
    const formData = await c.req.formData();
    
    const file = formData.get('file') as File;
    let filename = null;
    
    if (file && file.size > 0) {
      filename = await handleFileUpload(file);
    }
    
    // ✅ FIXED: Added withdraw field
    const body = {
      user_name: formData.get('user_name') as string,
      entry: formData.get('entry') as string,
      date: formData.get('date') as string,
      amount: formData.get('amount') as string,
      bank_title: formData.get('bank_title') as string,
      debit: formData.get('debit') as string,
      credit: formData.get('credit') as string,
      withdraw: formData.get('withdraw') as string, // ← ADDED THIS LINE
      file_path: filename
    };

    console.log('Received body with withdraw:', body); // Debug log

    const result = await createVender(body, globalThis.env.DB);
    return c.json(result, result.code);
  } catch (error) {
    console.error('Error creating vender:', error);
    return c.json({ status: 'error', message: 'Failed to create vender' }, 500);
  }
});

app.get('/vender', async (c) => {
  try {
    const result = await getVender(globalThis.env.DB);
    return c.json(result, result.code);
  } catch (error) {
    console.error('Error fetching vender:', error);
    return c.json({ status: 'error', message: 'Failed to fetch vender' }, 500);
  }
});

app.get('/vender/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await getVenderById(parseInt(id), globalThis.env.DB);
    return c.json(result, result.code);
  } catch (error) {
    console.error('Error fetching vender:', error);
    return c.json({ status: 'error', message: 'Failed to fetch vender' }, 500);
  }
});

app.get('/uploads/:filename', async (c) => {
  try {
    const filename = c.req.param('filename');
    return c.file(`./uploads/${filename}`);
  } catch (error) {
    return c.json({ status: 'error', message: 'File not found' }, 404);
  }
});

app.put('/vender/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const formData = await c.req.formData();
    
    const file = formData.get('file') as File;
    let filename = null;
    
    if (file && file.size > 0) {
      filename = await handleFileUpload(file);
    }
    
    // ✅ FIXED: Added withdraw field
    const body = {
      user_name: formData.get('user_name') as string,
      entry: formData.get('entry') as string,
      date: formData.get('date') as string,
      amount: formData.get('amount') as string,
      bank_title: formData.get('bank_title') as string,
      debit: formData.get('debit') as string,
      credit: formData.get('credit') as string,
      withdraw: formData.get('withdraw') as string, // ← ADDED THIS LINE
      file_path: filename
    };

    console.log('Received body for update with withdraw:', body); // Debug log

    const result = await updateVender(parseInt(id), body, globalThis.env.DB);
    return c.json(result, result.code);
  } catch (error) {
    console.error('Error updating vender:', error);
    return c.json({ status: 'error', message: 'Failed to update vender' }, 500);
  }
});

app.delete('/vender/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const result = await deleteVender(parseInt(id), globalThis.env.DB);
    return c.json(result, result.code);
  } catch (error) {
    console.error('Error deleting vender:', error);
    return c.json({ status: 'error', message: 'Failed to delete vender' }, 500);
  }
});