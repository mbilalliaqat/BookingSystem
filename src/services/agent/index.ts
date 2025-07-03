import { incrementEntryCounts } from "../counters";

export const createAgent = async (body: any, db: any) => {
  try {
    const [currentEntryNumber] = body.entry.split('/').map(Number);
    
    if (!body.agent_name) {
      return {
        status: 'error',
        code: 400,
        message: 'Agent name is required'
      };
    }

    // Parse and validate credit/debit values
    let credit = 0;
    let debit = 0;

    if (body.credit !== undefined && body.credit !== null && body.credit !== '') {
      const creditValue = Number(body.credit);
      if (!isNaN(creditValue) && creditValue > 0) {
        credit = creditValue;
      }
    }
    
    if (body.debit !== undefined && body.debit !== null && body.debit !== '') {
      const debitValue = Number(body.debit);
      if (!isNaN(debitValue) && debitValue > 0) {
        debit = debitValue;
      }
    }

    // Prevent both credit and debit in same transaction
    if (credit > 0 && debit > 0) {
      return {
        status: 'error',
        code: 400,
        message: 'Cannot have both credit and debit in the same transaction'
      };
    }

    // At least one of credit or debit should be provided
    if (credit === 0 && debit === 0) {
      return {
        status: 'error',
        code: 400,
        message: 'Either credit or debit amount is required'
      };
    }

    // Get the current balance for this agent by recalculating from all entries
    const currentBalance = await calculateCurrentBalance(body.agent_name, db);

    // Calculate new balance: current + credit - debit
    const newBalance = currentBalance + credit - debit;

    // Insert the new entry
    const newAgentRecord = await db
      .insertInto('agent')
      .values({
        agent_name: body.agent_name || '',
        date: body.date,
        employee: body.employee || '',
        entry: body.entry || '',
        detail: body.detail || '',
        credit: credit > 0 ? credit : null,
        debit: debit > 0 ? debit : null,
        balance: newBalance
      })
      .returningAll()
      .executeTakeFirst();

    if (newAgentRecord) {
      await incrementEntryCounts('agent', currentEntryNumber, db); // Update entry_counters table
      // Recalculate all balances for this agent to ensure consistency
      await recalculateAgentBalances(body.agent_name, db);
    }

    console.log(`Created agent entry for agent: ${body.agent_name}, Credit: ${credit}, Debit: ${debit}, Previous Balance: ${currentBalance}, New Balance: ${newBalance}`);

    return {
      status: 'success',
      code: 201,
      message: 'Agent transaction created successfully',
      agent: {
        id: newAgentRecord.id,
        agent_name: newAgentRecord.agent_name,
        date: newAgentRecord.date,
        employee: newAgentRecord.employee,
        entry: newAgentRecord.entry,
        detail: newAgentRecord.detail,
        credit: Number(newAgentRecord.credit) || 0,
        debit: Number(newAgentRecord.debit) || 0,
        balance: Number(newAgentRecord.balance)
      }
    };
  } catch (error) {
    console.error('Error creating agent entry:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to create agent transaction',
      errors: error.message
    };
  }
}

export const getAgent = async (db: any) => {
  try {
    const agents = await db
      .selectFrom('agent')
      .selectAll()
      .orderBy('id', 'desc')
      .execute();

    // Format output to ensure proper number formatting
    const formattedAgents = agents.map(agent => ({
      id: agent.id,
      agent_name: agent.agent_name,
      date: agent.date,
      employee: agent.employee,
      entry: agent.entry,
      detail: agent.detail,
      credit: Number(agent.credit) || 0,
      debit: Number(agent.debit) || 0,
      balance: Number(agent.balance)
    }));

    return {
      status: 'success',
      code: 200,
      agents: formattedAgents
    };
  } catch (error) {
    console.error('Error getting agents:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch agent records',
      errors: error.message
    };
  }
}

export const getAgentByName = async (agent_name: string, db: any) => {
  try {
    const agents = await db
      .selectFrom('agent')
      .selectAll()
      .where('agent_name', '=', agent_name)
      .orderBy('date', 'asc')
      .orderBy('id', 'asc')
      .execute();

    // Format output to ensure proper number formatting
    const formattedAgents = agents.map(agent => ({
      id: agent.id,
      agent_name: agent.agent_name,
      date: agent.date,
      employee: agent.employee,
      entry: agent.entry,
      detail: agent.detail,
      credit: Number(agent.credit) || 0,
      debit: Number(agent.debit) || 0,
      balance: Number(agent.balance)
    }));

    return {
      status: 'success',
      code: 200,
      agents: formattedAgents
    }
  } catch (error) {
    console.error('Error getting agent by name:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch agent records',
      errors: error.message
    };
  }
}

export const updateAgent = async (id: number, body: any, db: any) => {
  try {
    // First get the entry to be updated
    const existingAgent = await db
      .selectFrom('agent')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!existingAgent) {
      return {
        status: 'error',
        code: 404,
        message: 'Agent record not found'
      }
    }

    // Calculate new credit and debit values
    let credit = 0;
    let debit = 0;

    // Parse credit value
    if (body.credit !== undefined) {
      if (body.credit === null || body.credit === '' || body.credit === '0') {
        credit = 0;
      } else {
        const creditValue = Number(body.credit);
        if (!isNaN(creditValue) && creditValue > 0) {
          credit = creditValue;
        }
      }
    }

    // Parse debit value
    if (body.debit !== undefined) {
      if (body.debit === null || body.debit === '' || body.debit === '0') {
        debit = 0;
      } else {
        const debitValue = Number(body.debit);
        if (!isNaN(debitValue) && debitValue > 0) {
          debit = debitValue;
        }
      }
    }

    // Prevent both credit and debit in same transaction
    if (credit > 0 && debit > 0) {
      return {
        status: 'error',
        code: 400,
        message: 'Cannot have both credit and debit in the same transaction'
      }
    }

    // At least one of credit or debit should be provided
    if (credit === 0 && debit === 0) {
      return {
        status: 'error',
        code: 400,
        message: 'Either credit or debit amount is required'
      }
    }

    // Update the current entry
    const updatedAgent = await db
      .updateTable('agent')
      .set({
        agent_name: body.agent_name || existingAgent.agent_name,
        date: body.date || existingAgent.date,
        employee: body.employee !== undefined ? body.employee : existingAgent.employee,
        entry: body.entry !== undefined ? body.entry : existingAgent.entry,
        detail: body.detail !== undefined ? body.detail : existingAgent.detail,
        credit: credit > 0 ? credit : null,
        debit: debit > 0 ? debit : null,
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!updatedAgent) {
      return {
        status: 'error',
        code: 500,
        message: 'Failed to update agent record'
      };
    }

    // Recalculate all balances for this agent to ensure consistency
    await recalculateAgentBalances(updatedAgent.agent_name, db);

    // Get the updated entry with recalculated balance
    const finalAgent = await db
      .selectFrom('agent')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    console.log(`Updated agent entry ID ${id}: ${updatedAgent.agent_name}, Credit: ${credit}, Debit: ${debit}, New Balance: ${finalAgent.balance}`);

    return {
      status: 'success',
      code: 200,
      message: 'Agent record updated successfully',
      agent: {
        id: finalAgent.id,
        agent_name: finalAgent.agent_name,
        date: finalAgent.date,
        employee: finalAgent.employee,
        entry: finalAgent.entry,
        detail: finalAgent.detail,
        credit: Number(finalAgent.credit) || 0,
        debit: Number(finalAgent.debit) || 0,
        balance: Number(finalAgent.balance)
      }
    };

  } catch (error) {
    console.error('Error updating agent:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to update agent record',
      errors: error.message
    };
  }
}

export const deleteAgent = async (id: number, db: any) => {
  try {
    // First get the entry to be deleted
    const existingAgent = await db
      .selectFrom('agent')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!existingAgent) {
      return {
        status: 'error',
        code: 404,
        message: 'Agent record not found'
      };
    }

    const agentName = existingAgent.agent_name;

    // Delete the entry
    const deletedAgent = await db
      .deleteFrom('agent')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!deletedAgent) {
      return {
        status: 'error',
        code: 500,
        message: 'Failed to delete agent record'
      };
    }

    // Recalculate all balances for this agent to ensure consistency
    await recalculateAgentBalances(agentName, db);

    console.log(`Deleted agent entry ID ${id}: ${agentName}`);

    return {
      status: 'success',
      code: 200,
      message: 'Agent record deleted successfully',
      agent: {
        id: deletedAgent.id,
        agent_name: deletedAgent.agent_name,
        date: deletedAgent.date,
        employee: deletedAgent.employee,
        entry: deletedAgent.entry,
        detail: deletedAgent.detail,
        credit: Number(deletedAgent.credit) || 0,
        debit: Number(deletedAgent.debit) || 0,
        balance: Number(deletedAgent.balance)
      }
    };

  } catch (error) {
    console.error('Error in deleteAgent:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to delete agent record',
      errors: error.message
    };
  }
};

export const getExistingAgentNames = async (db: any) => {
  try {
    const agentNames = await db 
      .selectFrom('agent')
      .select('agent_name')
      .distinct()
      .where('agent_name', 'is not', null)
      .where('agent_name', '!=', '')
      .orderBy('agent_name', 'asc')
      .execute();

    const formattedNames = agentNames.map(item => item.agent_name);

    return {
      status: 'success',
      code: 200,
      agentNames: formattedNames
    };
    
  } catch (error) {
    console.error('Error getting agent names:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch agent names',
      errors: error.message
    };
  } 
}

// Helper function to calculate current balance for an agent
const calculateCurrentBalance = async (agentName: string, db: any) => {
  try {
    // Get all entries for this agent in ID order (creation order)
    const allEntries = await db
      .selectFrom('agent')
      .select(['credit', 'debit'])
      .where('agent_name', '=', agentName)
      .orderBy('id', 'asc')
      .execute();

    let balance = 0;
    
    // Calculate running balance: add credit, subtract debit
    for (const entry of allEntries) {
      const entryCredit = Number(entry.credit) || 0;
      const entryDebit = Number(entry.debit) || 0;
      balance = balance + entryCredit - entryDebit;
    }

    return balance;
  } catch (error) {
    console.error('Error calculating current balance:', error);
    return 0;
  }
};

// Helper function to recalculate all balances for an agent
const recalculateAgentBalances = async (agentName: string, db: any) => {
  try {
    // Get all entries for this agent in ID order (creation order)
    const allEntries = await db
      .selectFrom('agent')
      .select(['id', 'credit', 'debit', 'date'])
      .where('agent_name', '=', agentName)
      .orderBy('id', 'asc')
      .execute();

    let runningBalance = 0;
    
    // Process each entry in ID order (creation order)
    for (const entry of allEntries) {
      const entryCredit = Number(entry.credit) || 0;
      const entryDebit = Number(entry.debit) || 0;
      
      // Calculate the running balance: add credit, subtract debit
      runningBalance = runningBalance + entryCredit - entryDebit;

      // Update the running balance for this entry
      await db
        .updateTable('agent')
        .set({ balance: runningBalance })
        .where('id', '=', entry.id)
        .execute();
    }
  } catch (error) {
    console.error('Error recalculating agent balances:', error);
    throw error;
  }
};

// Utility function to fix all existing balances (run this once if needed)
export const fixAllAgentBalances = async (db: any) => {
  try {
    console.log('Starting to fix all agent balances...');
    
    // Get all unique agent names
    const agentNames = await db
      .selectFrom('agent')
      .select('agent_name')
      .distinct()
      .where('agent_name', 'is not', null)
      .where('agent_name', '!=', '')
      .execute();

    // Recalculate balances for each agent using the new helper function
    for (const agent of agentNames) {
      await recalculateAgentBalances(agent.agent_name, db);
    }

    console.log('Finished fixing all agent balances');
    
    return {
      status: 'success',
      code: 200,
      message: 'All agent balances have been recalculated successfully'
    };
    
  } catch (error) {
    console.error('Error fixing agent balances:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fix agent balances',
      errors: error.message
    };
  }
};