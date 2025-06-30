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

    // Get the current balance for this agent
    let currentBalance = 0;
    const latestRecord = await db
      .selectFrom('agent')
      .select(['balance'])
      .where('agent_name', '=', body.agent_name)
      .orderBy('date', 'desc')
      .orderBy('id', 'desc')
      .limit(1)
      .executeTakeFirst();

    if (latestRecord) {
      currentBalance = Number(latestRecord.balance) || 0;
    }

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
    // Start a transaction
    const result = await db.transaction().execute(async (trx) => {
      // Get the existing entry
      const existingAgent = await trx
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

      // Store old credit and debit values
      const oldCredit = Number(existingAgent.credit) || 0;
      const oldDebit = Number(existingAgent.debit) || 0;

      // Calculate new credit and debit values
      let credit = 0;
      let debit = 0;

      if (body.credit !== undefined) {
        if (body.credit === null || body.credit === '' || body.credit === '0') {
          credit = 0;
        } else {
          const creditValue = Number(body.credit);
          if (!isNaN(creditValue) && creditValue > 0) {
            credit = creditValue;
          }
        }
      } else {
        credit = oldCredit;
      }

      if (body.debit !== undefined) {
        if (body.debit === null || body.debit === '' || body.debit === '0') {
          debit = 0;
        } else {
          const debitValue = Number(body.debit);
          if (!isNaN(debitValue) && debitValue > 0) {
            debit = debitValue;
          }
        }
      } else {
        debit = oldDebit;
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

      // Calculate balance difference
      const oldBalance = oldCredit - oldDebit;
      const newBalance = credit - debit;
      const balanceDifference = newBalance - oldBalance;

      const newAgentName = body.agent_name || existingAgent.agent_name;

      // Update the current entry
      const updatedAgent = await trx
        .updateTable('agent')
        .set({
          agent_name: newAgentName,
          date: body.date || existingAgent.date,
          employee: body.employee !== undefined ? body.employee : existingAgent.employee,
          entry: body.entry !== undefined ? body.entry : existingAgent.entry,
          detail: body.detail !== undefined ? body.detail : existingAgent.detail,
          credit: credit > 0 ? credit : null,
          debit: debit > 0 ? debit : null,
          balance: Number(existingAgent.balance) + balanceDifference // Update balance for current entry
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

      // Update subsequent balances for the new agent name
      await updateSubsequentBalances(newAgentName, id, balanceDifference, trx);

      // If agent name changed, update balances for the old agent name
      if (existingAgent.agent_name !== newAgentName) {
        await updateSubsequentBalancesAfterDelete(existingAgent.agent_name, id, oldCredit - oldDebit, trx);
      }

      console.log(`Updated agent entry ID ${id}: ${newAgentName}, Credit: ${credit}, Debit: ${debit}, New Balance: ${updatedAgent.balance}`);

      return {
        status: 'success',
        code: 200,
        message: 'Agent record updated successfully',
        agent: {
          id: updatedAgent.id,
          agent_name: updatedAgent.agent_name,
          date: updatedAgent.date,
          employee: updatedAgent.employee,
          entry: updatedAgent.entry,
          detail: updatedAgent.detail,
          credit: Number(updatedAgent.credit) || 0,
          debit: Number(updatedAgent.debit) || 0,
          balance: Number(updatedAgent.balance)
        }
      };
    });

    return result;
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
    // Start a transaction
    const result = await db.transaction().execute(async (trx) => {
      // Get the entry to be deleted
      const existingAgent = await trx
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
      const deletedCredit = Number(existingAgent.credit) || 0;
      const deletedDebit = Number(existingAgent.debit) || 0;
      const balanceChange = deletedCredit - deletedDebit;

      // Delete the entry
      const deletedAgent = await trx
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

      // Update subsequent balances
      await updateSubsequentBalancesAfterDelete(agentName, id, balanceChange, trx);

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
    });

    return result;
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

// Helper function to update balances for the updated entry and subsequent entries
const updateSubsequentBalances = async (agentName: string, updatedId: number, balanceDifference: number, db: any) => {
  try {
    // Get all entries for this agent that come after the updated entry
    const entriesToUpdate = await db
      .selectFrom('agent')
      .select(['id', 'balance', 'date'])
      .where('agent_name', '=', agentName)
      .where('id', '>', updatedId) // Only update subsequent entries
      .orderBy('date', 'asc')
      .orderBy('id', 'asc')
      .execute();

    // Update each entry's balance
    for (const entry of entriesToUpdate) {
      const newBalance = Number(entry.balance) + balanceDifference;
      
      await db
        .updateTable('agent')
        .set({ balance: newBalance })
        .where('id', '=', entry.id)
        .execute();
    }
  } catch (error) {
    console.error('Error updating subsequent balances:', error);
    throw error;
  }
};

// Helper function to update balances after deletion
const updateSubsequentBalancesAfterDelete = async (agentName: string, deletedId: number, balanceChange: number, db: any) => {
  try {
    // Get all entries for this agent that come after the deleted entry
    const entriesToUpdate = await db
      .selectFrom('agent')
      .select(['id', 'balance', 'date'])
      .where('agent_name', '=', agentName)
      .where('id', '>', deletedId)
      .orderBy('date', 'asc')
      .orderBy('id', 'asc')
      .execute();

    // Update each subsequent entry's balance
    for (const entry of entriesToUpdate) {
      const newBalance = Number(entry.balance) - balanceChange;
      
      await db
        .updateTable('agent')
        .set({ balance: newBalance })
        .where('id', '=', entry.id)
        .execute();
    }
  } catch (error) {
    console.error('Error updating balances after deletion:', error);
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

    // Recalculate balances for each agent
    for (const agent of agentNames) {
      // Get all entries for this agent in chronological order
      const allEntries = await db
        .selectFrom('agent')
        .select(['id', 'credit', 'debit', 'date', 'balance'])
        .where('agent_name', '=', agent.agent_name)
        .orderBy('date', 'asc')
        .orderBy('id', 'asc')
        .execute();

      let runningBalance = 0;

      // Recalculate balance for each entry
      for (const entry of allEntries) {
        const credit = Number(entry.credit) || 0;
        const debit = Number(entry.debit) || 0;
        runningBalance = runningBalance + credit - debit;

        // Update the entry with the new balance
        await db
          .updateTable('agent')
          .set({ balance: runningBalance })
          .where('id', '=', entry.id)
          .execute();
      }
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