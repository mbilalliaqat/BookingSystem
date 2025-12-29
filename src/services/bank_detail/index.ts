import { incrementEntryCounts } from '../counters';
import { archiveRecord } from '../archive';

const formatDateForDB = (dateStr: string | null | undefined): string | null => {
  if (!dateStr || dateStr.trim() === '') {
    return null;
  }
  return dateStr;
};

export const createBankDetail = async (body: any, db: any) => {
  try {
    const now = new Date();
    // Extract number after space and before slash: "BD 1/3" -> 1
    const entryMatch = body.entry.match(/(\d+)\/\d+/);
    const currentEntryNumber = entryMatch ? parseInt(entryMatch[1]) : null;

    const newBankDetail = await db
      .insertInto('bank_details')
      .values({
        date: formatDateForDB(body.date),
        entry: body.entry,
        employee: body.employee,
        detail: body.detail,
        credit: parseFloat(body.credit) || 0,
        debit: parseFloat(body.debit) || 0,
        balance: parseFloat(body.balance) || 0,
        created_at: now,
        updated_at: now,
      })
      .returningAll()
      .executeTakeFirst();

    if (newBankDetail && currentEntryNumber) {
      console.log('Calling incrementEntryCounts for Bank Detail');
      await incrementEntryCounts('bank-detail', currentEntryNumber, db);
    }

    return {
      status: 'success',
      code: 201,
      message: 'Bank detail created successfully',
      data: newBankDetail,
    };
  } catch (error: any) {
    console.error('Error in createBankDetail:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to create bank detail',
      errors: error.message,
    };
  }
};

export const getBankDetails = async (db: any, filters?: any) => {
  try {
    let query = db.selectFrom('bank_details').selectAll();

    // Apply filters if provided
    if (filters?.employee) {
      query = query.where('employee', '=', filters.employee);
    }
    if (filters?.detail) {
      query = query.where('detail', 'like', `%${filters.detail}%`);
    }
    if (filters?.startDate && filters?.endDate) {
      query = query.where('date', '>=', filters.startDate).where('date', '<=', filters.endDate);
    }
    if (filters?.minCredit) {
      query = query.where('credit', '>=', parseFloat(filters.minCredit));
    }
    if (filters?.minDebit) {
      query = query.where('debit', '>=', parseFloat(filters.minDebit));
    }

    const bankDetails = await query.orderBy('created_at', 'desc').execute();

    return {
      status: 'success',
      code: 200,
      message: bankDetails.length > 0 ? 'Bank details fetched successfully' : 'No bank details found',
      data: bankDetails,
    };
  } catch (error: any) {
    console.error('Error in getBankDetails:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch bank details',
      errors: error.message,
    };
  }
};

export const getBankDetailById = async (id: number, db: any) => {
  try {
    const bankDetail = await db
      .selectFrom('bank_details')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!bankDetail) {
      return {
        status: 'error',
        code: 404,
        message: 'Bank detail not found',
      };
    }

    return {
      status: 'success',
      code: 200,
      message: 'Bank detail fetched successfully',
      data: bankDetail,
    };
  } catch (error: any) {
    console.error('Error in getBankDetailById:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch bank detail',
      errors: error.message,
    };
  }
};

export const updateBankDetail = async (id: number, body: any, db: any) => {
  try {
    const now = new Date();

    // Check if record exists
    const existing = await db
      .selectFrom('bank_details')
      .select(['id'])
      .where('id', '=', id)
      .executeTakeFirst();

    if (!existing) {
      return {
        status: 'error',
        code: 404,
        message: 'Bank detail not found',
      };
    }

    const updatedBankDetail = await db
      .updateTable('bank_details')
      .set({
        date: formatDateForDB(body.date),
        entry: body.entry,
        employee: body.employee,
        detail: body.detail,
        credit: parseFloat(body.credit) || 0,
        debit: parseFloat(body.debit) || 0,
        balance: parseFloat(body.balance) || 0,
        updated_at: now,
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    return {
      status: 'success',
      code: 200,
      message: 'Bank detail updated successfully',
      data: updatedBankDetail,
    };
  } catch (error: any) {
    console.error('Error in updateBankDetail:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to update bank detail',
      errors: error.message,
    };
  }
};

export const deleteBankDetail = async (id: number, db: any, deletedBy: string = 'system') => {
  try {
    // 1. Get bank detail data
    const bankDetailRecord = await db
      .selectFrom('bank_details')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!bankDetailRecord) {
      return { 
        status: 'error', 
        code: 404, 
        message: 'Bank detail not found' 
      };
    }

    // 2. Archive the record
    const archiveResult = await archiveRecord(
      'bank_details', 
      id, 
      { bankDetail: bankDetailRecord }, 
      db, 
      deletedBy
    );

    if (archiveResult.status !== 'success') {
      return { 
        status: 'error', 
        code: 500, 
        message: 'Failed to archive bank detail', 
        errors: archiveResult.message 
      };
    }

    // 3. Delete the record
    const deleted = await db
      .deleteFrom('bank_details')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    return {
      status: 'success',
      code: 200,
      message: 'Bank detail archived and deleted successfully',
      data: deleted,
    };
  } catch (error: any) {
    console.error('Error deleting bank detail:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to delete bank detail',
      errors: error.message,
    };
  }
};

export const searchBankDetails = async (searchTerm: string, db: any) => {
  try {
    const bankDetails = await db
      .selectFrom('bank_details')
      .selectAll()
      .where((eb: any) =>
        eb.or([
          eb('detail', 'like', `%${searchTerm}%`),
          eb('employee', 'like', `%${searchTerm}%`),
          eb('entry', 'like', `%${searchTerm}%`),
        ])
      )
      .orderBy('created_at', 'desc')
      .execute();

    return {
      status: 'success',
      code: 200,
      message: bankDetails.length > 0 ? 'Bank details found' : 'No matching bank details found',
      data: bankDetails,
    };
  } catch (error: any) {
    console.error('Error in searchBankDetails:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to search bank details',
      errors: error.message,
    };
  }
};

export const getBankDetailsByDateRange = async (startDate: string, endDate: string, db: any) => {
  try {
    const bankDetails = await db
      .selectFrom('bank_details')
      .selectAll()
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .orderBy('date', 'desc')
      .execute();

    return {
      status: 'success',
      code: 200,
      message: bankDetails.length > 0 ? 'Bank details fetched successfully' : 'No bank details found in date range',
      data: bankDetails,
    };
  } catch (error: any) {
    console.error('Error in getBankDetailsByDateRange:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch bank details by date range',
      errors: error.message,
    };
  }
};

export const getBankDetailsByEmployee = async (employee: string, db: any) => {
  try {
    const bankDetails = await db
      .selectFrom('bank_details')
      .selectAll()
      .where('employee', '=', employee)
      .orderBy('created_at', 'desc')
      .execute();

    return {
      status: 'success',
      code: 200,
      message: bankDetails.length > 0 ? 'Bank details fetched successfully' : 'No bank details found for employee',
      data: bankDetails,
    };
  } catch (error: any) {
    console.error('Error in getBankDetailsByEmployee:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch bank details by employee',
      errors: error.message,
    };
  }
};

export const getTotalBalances = async (db: any) => {
  try {
    const result = await db
      .selectFrom('bank_details')
      .select([
        db.fn.sum('credit').as('total_credit'),
        db.fn.sum('debit').as('total_debit'),
        db.fn.sum('balance').as('total_balance'),
      ])
      .executeTakeFirst();

    return {
      status: 'success',
      code: 200,
      message: 'Total balances calculated successfully',
      data: {
        total_credit: parseFloat(result?.total_credit || '0'),
        total_debit: parseFloat(result?.total_debit || '0'),
        total_balance: parseFloat(result?.total_balance || '0'),
      },
    };
  } catch (error: any) {
    console.error('Error in getTotalBalances:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to calculate total balances',
      errors: error.message,
    };
  }
};