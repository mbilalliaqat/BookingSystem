export const createAgent = async (body: any, db: any) => {
  try {
    if (!body.agent_name) {
      return {
        status: 'error',
        code: 400,
        message: 'Agent name is required'
      }
    }

    // Get the previous balance for this agent
    let previousBalance = 0;
    const latestRecord = await db
      .selectFrom('agent')
      .select('balance')
      .where('agent_name', '=', body.agent_name)
      .orderBy('id', 'desc')
      .limit(1)
      .executeTakeFirst();

    if (latestRecord) {
      previousBalance = Number(latestRecord.balance);
    }

    // Calculate new balance
    let newBalance = previousBalance;
    let credit = 0;
    let debit = 0;

    if (body.credit && Number(body.credit) > 0) {
      credit = Number(body.credit);
      newBalance += credit;
    } else if (body.debit && Number(body.debit) > 0) {
      debit = Number(body.debit);
      newBalance -= debit;
    }

    // Prevent both credit and debit in same transaction
    if (credit > 0 && debit > 0) {
      return {
        status: 'error',
        code: 400,
        message: 'Cannot have both credit and debit in the same transaction'
      }
    }

    const newAgent = await db
      .insertInto('agent')
      .values({
        agent_name: body.agent_name,
        date: body.date,
        employee: body.employee,
        entry: body.entry,
        detail: body.detail,
        credit: credit || null,
        debit: debit || null,
        balance: newBalance
      })
      .returningAll()
      .executeTakeFirst();

    return {
      status: 'success',
      code: 201,
      message: 'Agent transaction created successfully',
      agent: {
        id: newAgent.id,
        agent_name: newAgent.agent_name,
        date: newAgent.date,
        employee: newAgent.employee,
        entry: newAgent.entry,
        detail: newAgent.detail,
        credit: Number(newAgent.credit) || 0,
        debit: Number(newAgent.debit) || 0,
        balance: Number(newAgent.balance)
      }
    }

  } catch (error) {
    console.error('Error creating entry:', error);
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
    console.error('Error getting agent:', error);
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
    console.error('Error getting agent:', error);
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

    // Get all entries for the agent in chronological order
    const allEntries = await db
      .selectFrom('agent')
      .select(['id', 'credit', 'debit', 'balance'])
      .where('agent_name', '=', existingAgent.agent_name)
      .orderBy('date', 'asc')
      .orderBy('id', 'asc')
      .execute();

    // Calculate new credit and debit values
    let credit = 0;
    let debit = 0;

    if (body.credit !== undefined) {
      if (Number(body.credit) > 0) {
        credit = Number(body.credit);
      }
    } else {
      credit = Number(existingAgent.credit) || 0;
    }

    if (body.debit !== undefined) {
      if (Number(body.debit) > 0) {
        debit = Number(body.debit);
      }
    } else {
      debit = Number(existingAgent.debit) || 0;
    }

    // Prevent both credit and debit in same transaction
    if (credit > 0 && debit > 0) {
      return {
        status: 'error',
        code: 400,
        message: 'Cannot have both credit and debit in the same transaction'
      }
    }

    // Calculate the difference in balance this change will cause
    const oldContribution = Number(existingAgent.credit) - Number(existingAgent.debit);
    const newContribution = credit - debit;
    const balanceDifference = newContribution - oldContribution;

    // Update the current entry
    const updatedAgent = await db
      .updateTable('agent')
      .set({
        agent_name: body.agent_name || existingAgent.agent_name,
        date: body.date || existingAgent.date,
        employee: body.employee || existingAgent.employee,
        entry: body.entry || existingAgent.entry,
        detail: body.detail || existingAgent.detail,
        credit: credit || null,
        debit: debit || null,
        // Don't update balance here, we'll do it separately for all affected entries
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

    // Update balances for all entries from this point forward
    if (balanceDifference !== 0) {
      // Find the index of the updated entry
      const entryIndex = allEntries.findIndex(entry => entry.id === id);

      if (entryIndex !== -1) {
        // Update balances for all subsequent entries (including current one)
        for (let i = entryIndex; i < allEntries.length; i++) {
          const currentEntry = allEntries[i];
          const newBalance = Number(currentEntry.balance) + balanceDifference;

          await db
            .updateTable('agent')
            .set({
              balance: newBalance
            })
            .where('id', '=', currentEntry.id)
            .execute();

          // Update the balance in our local entry if it's the one we're returning
          if (currentEntry.id === id) {
            updatedAgent.balance = newBalance;
          }
        }
      }
    }

    // Get the updated entry with correct balance
    const finalAgent = await db
      .selectFrom('agent')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

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
      .select(['id', 'agent_name', 'credit', 'debit'])
      .where('id', '=', id)
      .executeTakeFirst();

    if (!existingAgent) {
      return {
        status: 'error',
        code: 404,
        message: 'Agent record not found'
      };
    }

    // Calculate the balance impact of this entry
    const balanceImpact = Number(existingAgent.credit) - Number(existingAgent.debit);

    // Get all entries for the agent in chronological order
    const allEntries = await db
      .selectFrom('agent')
      .select(['id', 'balance'])
      .where('agent_name', '=', existingAgent.agent_name)
      .orderBy('date', 'asc')
      .orderBy('id', 'asc')
      .execute();

    // Find the index of the entry to be deleted
    const entryIndex = allEntries.findIndex(entry => entry.id === id);

    if (entryIndex !== -1) {
      // Delete the entry
      const deletedAgent = await db
        .deleteFrom('agent')
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();

      // Update balances for all subsequent entries
      for (let i = entryIndex + 1; i < allEntries.length; i++) {
        const currentEntry = allEntries[i];
        const newBalance = Number(currentEntry.balance) - balanceImpact;

        await db
          .updateTable('agent')
          .set({
            balance: newBalance
          })
          .where('id', '=', currentEntry.id)
          .execute();
      }

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
    }

    return {
      status: 'error',
      code: 500,
      message: 'Failed to delete agent record'
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
    const agentName = await db 
     .selectFrom('agent')
     .select('agent_name')
     .distinct()
     .where ('agent_name', 'is not', null)
     .where('agent_name', '!=', '')
     .orderBy('agent_name', 'asc')
    .execute();

    const formattedNames = agentName.map(item => item.agent_name);

      return {
      status: 'success',
      code: 200,
      agentNames: formattedNames
    };
    
  }
  catch(error){
     console.error('Error getting agent names:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch agent names',
      errors: error.message
    };
  } 
}