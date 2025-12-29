import { incrementEntryCounts } from '../counters';
import { archiveRecord } from '../archive';

const formatDateForDB = (dateStr: string | null | undefined): string | null => {
  if (!dateStr || dateStr.trim() === '') {
    return null;
  }
  return dateStr;
};

export const createENumber = async (body: any, db: any) => {
  try {
    const now = new Date();
    // Extract number after space and before slash: "EN 1/3" -> 1
    const entryMatch = body.entryNo.match(/(\d+)\/\d+/);
    const currentEntryNumber = entryMatch ? parseInt(entryMatch[1]) : null;

    const newENumber = await db
      .insertInto('e_numbers')
      .values({
        date: formatDateForDB(body.date),
        employee: body.employee,
        entry_no: body.entryNo,
        file_no: body.fileNo,
        visa_id: body.visaId,
        reference: body.reference,
        passport_no: body.passportNo,
        mobile_no: body.mobileNo,
        pay_from_bank_card: body.payFromBankCard,
        card_amount: body.card_amount,
        created_at: now,
        updated_at: now,
      })
      .returningAll()
      .executeTakeFirst();

    if (newENumber && currentEntryNumber) {
      console.log('Calling incrementEntryCounts for E-Number');
      await incrementEntryCounts('e-number', currentEntryNumber, db);
    }

    return {
      status: 'success',
      code: 201,
      message: 'E-Number created successfully',
      data: newENumber,
    };
  } catch (error: any) {
    console.error('Error in createENumber:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to create E-Number',
      errors: error.message,
    };
  }
};

export const getENumbers = async (db: any, filters?: any) => {
  try {
    let query = db.selectFrom('e_numbers').selectAll();

    // Apply filters if provided
    if (filters?.employee) {
      query = query.where('employee', '=', filters.employee);
    }
    if (filters?.fileNo) {
      query = query.where('file_no', 'like', `%${filters.fileNo}%`);
    }
    if (filters?.visaId) {
      query = query.where('visa_id', 'like', `%${filters.visaId}%`);
    }
    if (filters?.reference) {
      query = query.where('reference', 'like', `%${filters.reference}%`);
    }
    if (filters?.passportNo) {
      query = query.where('passport_no', 'like', `%${filters.passportNo}%`);
    }
    if (filters?.startDate && filters?.endDate) {
      query = query.where('date', '>=', filters.startDate).where('date', '<=', filters.endDate);
    }

    const eNumbers = await query.orderBy('created_at', 'desc').execute();

    return {
      status: 'success',
      code: 200,
      message: eNumbers.length > 0 ? 'E-Numbers fetched successfully' : 'No E-Numbers found',
      data: eNumbers,
    };
  } catch (error: any) {
    console.error('Error in getENumbers:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch E-Numbers',
      errors: error.message,
    };
  }
};

export const getENumberById = async (id: number, db: any) => {
  try {
    const eNumber = await db
      .selectFrom('e_numbers')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!eNumber) {
      return {
        status: 'error',
        code: 404,
        message: 'E-Number not found',
      };
    }

    return {
      status: 'success',
      code: 200,
      message: 'E-Number fetched successfully',
      data: eNumber,
    };
  } catch (error: any) {
    console.error('Error in getENumberById:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch E-Number',
      errors: error.message,
    };
  }
};

export const updateENumber = async (id: number, body: any, db: any) => {
  try {
    const now = new Date();

    // Check if record exists
    const existing = await db
      .selectFrom('e_numbers')
      .select(['id'])
      .where('id', '=', id)
      .executeTakeFirst();

    if (!existing) {
      return {
        status: 'error',
        code: 404,
        message: 'E-Number not found',
      };
    }

    const updatedENumber = await db
      .updateTable('e_numbers')
      .set({
        date: formatDateForDB(body.date),
        employee: body.employee,
        entry_no: body.entryNo,
        file_no: body.fileNo,
        visa_id: body.visaId,
        reference: body.reference,
        passport_no: body.passportNo,
        mobile_no: body.mobileNo,
        pay_from_bank_card: body.payFromBankCard,
        card_amount: body.card_amount,
        updated_at: now,
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    return {
      status: 'success',
      code: 200,
      message: 'E-Number updated successfully',
      data: updatedENumber,
    };
  } catch (error: any) {
    console.error('Error in updateENumber:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to update E-Number',
      errors: error.message,
    };
  }
};

export const deleteENumber = async (id: number, db: any, deletedBy: string = 'system') => {
  try {
    // 1. Get E-Number data
    const eNumberRecord = await db
      .selectFrom('e_numbers')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!eNumberRecord) {
      return { 
        status: 'error', 
        code: 404, 
        message: 'E-Number not found' 
      };
    }

    // 2. Archive the record
    const archiveResult = await archiveRecord(
      'e_numbers', 
      id, 
      { eNumber: eNumberRecord }, 
      db, 
      deletedBy
    );

    if (archiveResult.status !== 'success') {
      return { 
        status: 'error', 
        code: 500, 
        message: 'Failed to archive E-Number', 
        errors: archiveResult.message 
      };
    }

    // 3. Delete the record
    const deleted = await db
      .deleteFrom('e_numbers')
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    return {
      status: 'success',
      code: 200,
      message: 'E-Number archived and deleted successfully',
      data: deleted,
    };
  } catch (error: any) {
    console.error('Error deleting E-Number:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to delete E-Number',
      errors: error.message,
    };
  }
};

export const searchENumbers = async (searchTerm: string, db: any) => {
  try {
    const eNumbers = await db
      .selectFrom('e_numbers')
      .selectAll()
      .where((eb: any) =>
        eb.or([
          eb('file_no', 'like', `%${searchTerm}%`),
          eb('visa_id', 'like', `%${searchTerm}%`),
          eb('reference', 'like', `%${searchTerm}%`),
          eb('passport_no', 'like', `%${searchTerm}%`),
          eb('mobile_no', 'like', `%${searchTerm}%`),
          eb('employee', 'like', `%${searchTerm}%`),
        ])
      )
      .orderBy('created_at', 'desc')
      .execute();

    return {
      status: 'success',
      code: 200,
      message: eNumbers.length > 0 ? 'E-Numbers found' : 'No matching E-Numbers found',
      data: eNumbers,
    };
  } catch (error: any) {
    console.error('Error in searchENumbers:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to search E-Numbers',
      errors: error.message,
    };
  }
};

export const getENumbersByDateRange = async (startDate: string, endDate: string, db: any) => {
  try {
    const eNumbers = await db
      .selectFrom('e_numbers')
      .selectAll()
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .orderBy('date', 'desc')
      .execute();

    return {
      status: 'success',
      code: 200,
      message: eNumbers.length > 0 ? 'E-Numbers fetched successfully' : 'No E-Numbers found in date range',
      data: eNumbers,
    };
  } catch (error: any) {
    console.error('Error in getENumbersByDateRange:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch E-Numbers by date range',
      errors: error.message,
    };
  }
};

export const getENumbersByEmployee = async (employee: string, db: any) => {
  try {
    const eNumbers = await db
      .selectFrom('e_numbers')
      .selectAll()
      .where('employee', '=', employee)
      .orderBy('created_at', 'desc')
      .execute();

    return {
      status: 'success',
      code: 200,
      message: eNumbers.length > 0 ? 'E-Numbers fetched successfully' : 'No E-Numbers found for employee',
      data: eNumbers,
    };
  } catch (error: any) {
    console.error('Error in getENumbersByEmployee:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch E-Numbers by employee',
      errors: error.message,
    };
  }
};