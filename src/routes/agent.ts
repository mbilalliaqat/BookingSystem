import app from '../app';
import {createAgent,getAgent,getAgentByName,updateAgent,deleteAgent,getExistingAgentNames } from '../services/agent/index';

app.post('/agent',async (c) =>{
    try{
        const body=await c.req.json();
        const result = await createAgent(body,globalThis.env.DB);
        return c.json(result);
        
    }
    catch(error){
        console.error('Error creating agent record:', error);
    return c.json({ status: 'error', message: 'Failed to create agent record' }, 500); 
    }
});

app.get('/agent',async (c) =>{
    try{
        const result = await getAgent(globalThis.env.DB);
        return c.json(result);
    }
    catch(error){
       console.error('Error fetching agent records:', error);
    return c.json({ status: 'error', message: 'Failed to fetch agent records' }, 500); 
    }
})

app.get('/agent/:agent_name', async (c) => {
  try {
    const agent_name = c.req.param('agent_name');
    const result = await getAgentByName(agent_name, globalThis.env.DB);
    return c.json(result);
  } catch (error) {
    console.error('Error fetching agent records:', error);
    return c.json({ status: 'error', message: 'Failed to fetch agent records' }, 500);
  }
});

app.put('/agent/:id', async(c) =>{
    try{
        const id = Number(c.req.param('id'));
        const body = await c.req.json();
        const result = await updateAgent(id,body,globalThis.env.DB);
        return c.json(result);
    }
    catch(error){
     
        console.error('Error updating agent record:', error);
        return c.json({ status: 'error', message: 'Failed to update agent record' }, 500);
    }
});

app.delete('/agent/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const deletedBy = c.req.header('X-User-Name') || 'system';
    const result = await deleteAgent(id, globalThis.env.DB, deletedBy);
    return c.json(
      {
        status: result.status,
        message: result.message,
        ...(result.agent && { agent: result.agent }),
        ...(result.errors && { errors: result.errors }),
      },
      result.code
    );
  } catch (error) {
    console.error('Error deleting agent record:', error);
    return c.json({ status: 'error', message: 'Failed to delete agent record' }, 500);
  }
});

app.get('/agent-names/existing', async (c) => {
  try {
    const result = await getExistingAgentNames(globalThis.env.DB);
    return c.json(result);
  } catch (error) {
    console.error('Error fetching agent names:', error);
    return c.json({ status: 'error', message: 'Failed to fetch agent names' }, 500);
  }
});
