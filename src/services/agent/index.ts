import { incrementEntryCounts } from "../counters";
import { archiveRecord } from '../archive';

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

    // Initialize credit, debit, and receivable amount
    let credit = 0;
    let debit = 0;
    let receivableAmount = 0;

    // Parse credit value (allowing 0)
    if (body.credit !== undefined && body.credit !== null) {
      const creditValue = Number(body.credit);
      if (!isNaN(creditValue)) {
        credit = creditValue; // Allow 0 or other valid credit amounts
      }
    }

    // Parse receivable amount (allowing 0 or positive values)
    if (body.receivable_amount !== undefined && body.receivable_amount !== null) {
      const receivableValue = Number(body.receivable_amount);
      if (!isNaN(receivableValue) && receivableValue >= 0) {
        receivableAmount = receivableValue;
      }
    }

    // Parse debit value (allowing 0)
    if (body.debit !== undefined && body.debit !== null) {
      const debitValue = Number(body.debit);
      if (!isNaN(debitValue)) {
        debit = debitValue; // Allow 0 or other valid debit amounts
      }
    }

    // Additional validation can be added for specific conditions (if needed)
   

    // Parse and validate paid_cash/paid_bank values
    let paidCash = 0;
    let paidBank = 0;

    if (body.paid_cash !== undefined && body.paid_cash !== null && body.paid_cash !== '') {
      const paidCashValue = Number(body.paid_cash);
      if (!isNaN(paidCashValue) && paidCashValue > 0) {
        paidCash = paidCashValue;
      }
    }

    if (body.paid_bank !== undefined && body.paid_bank !== null && body.paid_bank !== '') {
      const paidBankValue = Number(body.paid_bank);
      if (!isNaN(paidBankValue) && paidBankValue > 0) {
        paidBank = paidBankValue;
      }
    }

    
    // At least one of credit or debit should be provided
    

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
        paid_cash: paidCash > 0 ? paidCash : null,
        paid_bank: paidBank > 0 ? paidBank : null,
        receivable_amount: receivableAmount > 0 ? receivableAmount : null,
        balance: newBalance
      })
      .returningAll()
      .executeTakeFirst();

    if (newAgentRecord) {
      await incrementEntryCounts('agent', currentEntryNumber, db); // Update entry_counters table
      // Recalculate all balances for this agent to ensure consistency
      await recalculateAgentBalances(body.agent_name, db);
    }

    console.log(`Created agent entry for agent: ${body.agent_name}, Credit: ${credit}, Debit: ${debit}, Paid Cash: ${paidCash}, Paid Bank: ${paidBank}, Previous Balance: ${currentBalance}, New Balance: ${newBalance}`);

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
        paid_cash: Number(newAgentRecord.paid_cash) || 0,
        paid_bank: Number(newAgentRecord.paid_bank) || 0,
         receivable_amount: Number(newAgentRecord.receivable_amount) || 0,
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
      paid_cash: Number(agent.paid_cash) || 0,
      paid_bank: Number(agent.paid_bank) || 0,
       receivable_amount: Number(agent.receivable_amount) || 0,
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
      paid_cash: Number(agent.paid_cash) || 0,
      paid_bank: Number(agent.paid_bank) || 0,
      receivable_amount: Number(agent.receivable_amount) || 0,

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

    // Parse paid_cash and paid_bank values
    let paidCash = 0;
    let paidBank = 0;
    let receivableAmount = 0;

    if (body.paid_cash !== undefined) {
      if (body.paid_cash === null || body.paid_cash === '' || body.paid_cash === '0') {
        paidCash = 0;
      } else {
        const paidCashValue = Number(body.paid_cash);
        if (!isNaN(paidCashValue) && paidCashValue > 0) {
          paidCash = paidCashValue;
        }
      }
    }

    if (body.receivable_amount !== undefined) {
      if (body.receivable_amount === null || body.receivable_amount === '' || body.receivable_amount === '0') {
        receivableAmount = 0;
      } else {
        const receivableValue = Number(body.receivable_amount);
        if (!isNaN(receivableValue) && receivableValue >= 0) {
          receivableAmount = receivableValue;
        }
      }
    }

    if (body.paid_bank !== undefined) {
      if (body.paid_bank === null || body.paid_bank === '' || body.paid_bank === '0') {
        paidBank = 0;
      } else {
        const paidBankValue = Number(body.paid_bank);
        if (!isNaN(paidBankValue) && paidBankValue > 0) {
          paidBank = paidBankValue;
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
        paid_cash: paidCash > 0 ? paidCash : null,
        paid_bank: paidBank > 0 ? paidBank : null,
        receivable_amount: receivableAmount > 0 ? receivableAmount : null,

        
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

    console.log(`Updated agent entry ID ${id}: ${updatedAgent.agent_name}, Credit: ${credit}, Debit: ${debit}, Paid Cash: ${paidCash}, Paid Bank: ${paidBank}, New Balance: ${finalAgent.balance}`);

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
        paid_cash: Number(finalAgent.paid_cash) || 0,
        paid_bank: Number(finalAgent.paid_bank) || 0,
        balance: Number(finalAgent.balance),
        receivable_amount: Number(finalAgent.receivable_amount) || 0,

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

export const deleteAgent = async (id: number, db: any, deletedBy: string = 'system') => {
  try {
    // 1. Fetch the entry to be deleted
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

    // 2. Archive agent record
    const archiveResult = await archiveRecord('agent', id, { agent: existingAgent }, db, deletedBy);

    if (archiveResult.status !== 'success') {
      return { status: 'error', code: 500, message: 'Failed to archive agent record', errors: archiveResult.message };
    }

    // 3. Delete the entry
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

    // 4. Recalculate all balances for this agent to ensure consistency
    await recalculateAgentBalances(agentName, db);

    console.log(`Deleted agent entry ID ${id}: ${agentName}`);

    return {
      status: 'success',
      code: 200,
      message: 'Agent record archived and deleted successfully',
      agent: {
        id: deletedAgent.id,
        agent_name: deletedAgent.agent_name,
        date: deletedAgent.date,
        employee: deletedAgent.employee,
        entry: deletedAgent.entry,
        detail: deletedAgent.detail,
        credit: Number(deletedAgent.credit) || 0,
        debit: Number(deletedAgent.debit) || 0,
        paid_cash: Number(deletedAgent.paid_cash) || 0,
        paid_bank: Number(deletedAgent.paid_bank) || 0,
        receivable_amount: Number(deletedAgent.receivable_amount) || 0,

        balance: Number(deletedAgent.balance)
      }
    };

  } catch (error: any) {
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

// New function to get agent payment summary
export const getAgentPaymentSummary = async (agent_name: string, db: any) => {
  try {
    const summary = await db
      .selectFrom('agent')
      .select([
        db.fn.sum('credit').as('total_credit'),
        db.fn.sum('debit').as('total_debit'),
        db.fn.sum('paid_cash').as('total_paid_cash'),
        db.fn.sum('paid_bank').as('total_paid_bank')
      ])
      .where('agent_name', '=', agent_name)
      .executeTakeFirst();

    const totalCredit = Number(summary.total_credit) || 0;
    const totalDebit = Number(summary.total_debit) || 0;
    const totalPaidCash = Number(summary.total_paid_cash) || 0;
    const totalPaidBank = Number(summary.total_paid_bank) || 0;
    const totalPaid = totalPaidCash + totalPaidBank;
    const currentBalance = totalCredit - totalDebit;
    const remainingBalance = currentBalance - totalPaid;

    return {
      status: 'success',
      code: 200,
      summary: {
        agent_name,
        total_credit: totalCredit,
        total_debit: totalDebit,
        current_balance: currentBalance,
        total_paid_cash: totalPaidCash,
        total_paid_bank: totalPaidBank,
        total_paid: totalPaid,
        remaining_balance: remainingBalance
      }
    };
  } catch (error) {
    console.error('Error getting agent payment summary:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch agent payment summary',
      errors: error.message
    };
  }
};

// New function to get all agents payment summary
export const getAllAgentsPaymentSummary = async (db: any) => {
  try {
    const summaries = await db
      .selectFrom('agent')
      .select([
        'agent_name',
        db.fn.sum('credit').as('total_credit'),
        db.fn.sum('debit').as('total_debit'),
        db.fn.sum('paid_cash').as('total_paid_cash'),
        db.fn.sum('paid_bank').as('total_paid_bank')
      ])
      .where('agent_name', 'is not', null)
      .where('agent_name', '!=', '')
      .groupBy('agent_name')
      .orderBy('agent_name', 'asc')
      .execute();

    const formattedSummaries = summaries.map(summary => {
      const totalCredit = Number(summary.total_credit) || 0;
      const totalDebit = Number(summary.total_debit) || 0;
      const totalPaidCash = Number(summary.total_paid_cash) || 0;
      const totalPaidBank = Number(summary.total_paid_bank) || 0;
      const totalPaid = totalPaidCash + totalPaidBank;
      const currentBalance = totalCredit - totalDebit;
      const remainingBalance = currentBalance - totalPaid;

      return {
        agent_name: summary.agent_name,
        total_credit: totalCredit,
        total_debit: totalDebit,
        current_balance: currentBalance,
        total_paid_cash: totalPaidCash,
        total_paid_bank: totalPaidBank,
        total_paid: totalPaid,
        remaining_balance: remainingBalance
      };
    });

    return {
      status: 'success',
      code: 200,
      summaries: formattedSummaries
    };
  } catch (error) {
    console.error('Error getting all agents payment summary:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch agents payment summary',
      errors: error.message
    };
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