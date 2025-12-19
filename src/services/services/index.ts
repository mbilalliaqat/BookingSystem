import { incrementEntryCounts } from "../counters";

const formatDateForDB = (dateStr: string | null | undefined): string | null => {
  if (!dateStr || dateStr.trim() === "") return null;
  return dateStr;
};

export const createService = async (body: any, db: any) => {
  try {
    const now = new Date();
    // Extract number from formats like "SE 2/5", "2/5" -> extracts 2
    const entryMatch = body.entry.match(/(\d+)\/(\d+)/);
    const currentEntryNumber = entryMatch ? parseInt(entryMatch[1]) : null;


    const newService = await db
      .insertInto("services")
      .values({
        user_name: body.user_name,
        entry: body.entry,
        customer_add: body.customer_add,
        status: body.status || 'Processing',
        booking_date: formatDateForDB(body.booking_date),
        remaining_date: formatDateForDB(body.remaining_date),
        specific_detail: body.specific_detail,
        visa_type: body.visa_type,
        receivable_amount: parseFloat(body.receivable_amount) || 0,
        paid_cash: parseFloat(body.paid_cash) || 0,
        paid_from_bank: body.paid_from_bank || null,
        paid_in_bank: parseFloat(body.paid_in_bank) || 0,
        profit: parseFloat(body.profit) || 0,
        remaining_amount: parseFloat(body.remaining_amount) || 0,
        vendors: body.vendors ? JSON.stringify(body.vendors) : null,
        agent_name: body.agent_name || null,
        createdAt: now,
      })
      .returningAll()
      .executeTakeFirst();

   

    if (newService && currentEntryNumber) {
      console.log('Calling incrementEntryCounts for Service');
      await incrementEntryCounts("services", currentEntryNumber, db);
    }
    

    return {
      status: "success",
      code: 201,
      message: "Service created successfully",
      data: newService,
    };
  } catch (error: any) {
    console.error("Error in createService:", error);
    return {
      status: "error",
      code: 500,
      message: "Failed to create service",
      errors: error.message,
    };
  }
};

export const updateService = async (id: number, body: any, db: any) => {
  try {
    const now = new Date();

    const updatedService = await db
      .updateTable("services")
      .set({
        user_name: body.user_name,
        entry: body.entry,
        customer_add: body.customer_add,
        status: body.status || 'Processing',
        booking_date: formatDateForDB(body.booking_date),
        remaining_date: formatDateForDB(body.remaining_date),
        specific_detail: body.specific_detail,
        visa_type: body.visa_type,
        receivable_amount: parseFloat(body.receivable_amount) || 0,
        paid_cash: parseFloat(body.paid_cash) || 0,
        paid_from_bank: body.paid_from_bank || null,
        paid_in_bank: parseFloat(body.paid_in_bank) || 0,
        profit: parseFloat(body.profit) || 0,
        remaining_amount: parseFloat(body.remaining_amount) || 0,
        vendors: body.vendors ? JSON.stringify(body.vendors) : null,
        agent_name: body.agent_name || null,
      })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();

    if (!updatedService) {
      return {
        status: "error",
        code: 404,
        message: "Service not found",
      };
    }

    return {
      status: "success",
      code: 200,
      message: "Service updated successfully",
      data: updatedService,
    };
  } catch (error: any) {
    console.error("Error in updateService:", error);
    return {
      status: "error",
      code: 500,
      message: "Failed to update service",
      errors: error.message,
    };
  }
};

export const getServices = async (db: any) => {
  try {
    const services = await db
      .selectFrom("services")
      .selectAll()
      .orderBy("createdAt", "desc")
      .execute();

    return {
      status: "success",
      code: 200,
      services,
    };
  } catch (error: any) {
    console.error("Error in getServices:", error);
    return {
      status: "error",
      code: 500,
      message: "Failed to fetch services",
      errors: error.message,
    };
  }
};

export const getServiceById = async (id: number, db: any) => {
  try {
    const service = await db
      .selectFrom("services")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!service) {
      return {
        status: "error",
        code: 404,
        message: "Service not found",
      };
    }

    return {
      status: "success",
      code: 200,
      service,
    };
  } catch (error: any) {
    console.error("Error in getServiceById:", error);
    return {
      status: "error",
      code: 500,
      message: "Failed to fetch service",
      errors: error.message,
    };
  }
};
 
export const createServicePayment = async (body: any, db: any) => {
  try {
    const now = new Date();

    const currentService = await db
      .selectFrom('services')
      .select(['remaining_amount', 'paid_cash', 'paid_in_bank'])
      .where('id', '=', body.service_id)
      .executeTakeFirst();

    if (!currentService) {
      return { status: 'error', code: 404, message: 'Service not found for payment update' };
    }

    const amountPaidCash = parseFloat(body.paid_cash) || 0;
    const amountPaidBank = parseFloat(body.paid_in_bank) || 0;
    const totalPayment = amountPaidCash + amountPaidBank;

    const currentRemaining = parseFloat(currentService.remaining_amount) || 0;
    const currentPaidCash = parseFloat(currentService.paid_cash) || 0;
    const currentPaidInBank = parseFloat(currentService.paid_in_bank) || 0;

    if (totalPayment > currentRemaining) {
      return { status: 'error', code: 400, message: `Payment amount (${totalPayment}) exceeds remaining amount (${currentRemaining})` };
    }

    const newRemaining = currentRemaining - totalPayment;
    const newPaidCash = currentPaidCash + amountPaidCash;
    const newPaidInBank = currentPaidInBank + amountPaidBank;

    const newPayment = await db
      .insertInto('services_payments')
      .values({
        service_id: body.service_id,
        payment_date: formatDateForDB(body.payment_date) || now.toISOString().split('T')[0],
        paid_cash: amountPaidCash,
        paid_in_bank: amountPaidBank,
        bank_title: body.bank_title || null,
        recorded_by: body.recorded_by,
        created_at: now,
        remaining_amount: newRemaining,
      })
      .returningAll()
      .executeTakeFirst();

    const updatedService = await db
      .updateTable('services')
      .set({ remaining_amount: newRemaining, paid_cash: newPaidCash, paid_in_bank: newPaidInBank, updated_at: now })
      .where('id', '=', body.service_id)
      .returningAll()
      .executeTakeFirst();

    return { status: 'success', code: 201, message: 'Payment recorded and service amounts updated successfully', payment: newPayment, service: updatedService };
  } catch (error: any) {
    console.error('Error in createServicePayment:', error);
    return { status: 'error', code: 500, message: 'Failed to record payment or update service', errors: error.message };
  }
};

export const getServicePaymentsByServiceId = async (serviceId: number, db: any) => {
  try {
    const payments = await db
      .selectFrom('services_payments')
      .selectAll()
      .where('service_id', '=', serviceId)
      .orderBy('created_at', 'asc')
      .execute();

    if (!payments || payments.length === 0) {
      return { status: 'success', code: 200, message: 'No payments found for this service', payments: [] };
    }

    return { status: 'success', code: 200, message: 'Service payment history fetched successfully', payments };
  } catch (error: any) {
    console.error('Error in getServicePaymentsByServiceId:', error);
    return { status: 'error', code: 500, message: 'Failed to fetch service payment history', errors: error.message };
  }
};

export const updateServicePayment = async (paymentId: number, body: any, db: any) => {
  try {
    const currentPayment = await db
      .selectFrom('services_payments')
      .selectAll()
      .where('id', '=', paymentId)
      .executeTakeFirst();

    if (!currentPayment) {
      return { status: 'error', code: 404, message: 'Payment not found' };
    }

    const oldCash = parseFloat(currentPayment.paid_cash) || 0;
    const oldBank = parseFloat(currentPayment.paid_in_bank) || 0;
    const newCash = parseFloat(body.paid_cash) || 0;
    const newBank = parseFloat(body.paid_in_bank) || 0;

    const cashDiff = newCash - oldCash;
    const bankDiff = newBank - oldBank;
    const totalDiff = cashDiff + bankDiff;

    const currentService = await db
      .selectFrom('services')
      .select(['remaining_amount', 'paid_cash', 'paid_in_bank'])
      .where('id', '=', currentPayment.service_id)
      .executeTakeFirst();

    if (!currentService) {
      return { status: 'error', code: 404, message: 'Service not found' };
    }

    const newRemaining = parseFloat(currentService.remaining_amount) - totalDiff;
    const newPaidCash = parseFloat(currentService.paid_cash) + cashDiff;
    const newPaidInBank = parseFloat(currentService.paid_in_bank) + bankDiff;

    const updatedPayment = await db
      .updateTable('services_payments')
      .set({ payment_date: formatDateForDB(body.payment_date), paid_cash: newCash, paid_in_bank: newBank, bank_title: body.bank_title || null, recorded_by: body.recorded_by, remaining_amount: newRemaining })
      .where('id', '=', paymentId)
      .returningAll()
      .executeTakeFirst();

    await db
      .updateTable('services')
      .set({ remaining_amount: newRemaining, paid_cash: newPaidCash, paid_in_bank: newPaidInBank })
      .where('id', '=', currentPayment.service_id)
      .execute();

    return { status: 'success', code: 200, message: 'Payment updated successfully', payment: updatedPayment };
  } catch (error: any) {
    console.error('Error in updateServicePayment:', error);
    return { status: 'error', code: 500, message: 'Failed to update payment', errors: error.message };
  }
};

export const deleteServicePayment = async (paymentId: number, db: any) => {
  try {
    const paymentRecord = await db
      .selectFrom('services_payments')
      .selectAll()
      .where('id', '=', paymentId)
      .executeTakeFirst();

    if (!paymentRecord) {
      return { status: 'error', code: 404, message: 'Payment not found' };
    }

    const cashAmount = parseFloat(paymentRecord.paid_cash) || 0;
    const bankAmount = parseFloat(paymentRecord.paid_in_bank) || 0;

    const currentService = await db
      .selectFrom('services')
      .select(['remaining_amount', 'paid_cash', 'paid_in_bank'])
      .where('id', '=', paymentRecord.service_id)
      .executeTakeFirst();

    if (!currentService) {
      return { status: 'error', code: 404, message: 'Service not found' };
    }

    const newRemaining = parseFloat(currentService.remaining_amount) + cashAmount + bankAmount;
    const newPaidCash = parseFloat(currentService.paid_cash) - cashAmount;
    const newPaidInBank = parseFloat(currentService.paid_in_bank) - bankAmount;

    const deletedPayment = await db
      .deleteFrom('services_payments')
      .where('id', '=', paymentId)
      .returningAll()
      .executeTakeFirst();

    await db
      .updateTable('services')
      .set({ remaining_amount: newRemaining, paid_cash: newPaidCash, paid_in_bank: newPaidInBank })
      .where('id', '=', paymentRecord.service_id)
      .execute();

    return { status: 'success', code: 200, message: 'Payment deleted successfully and service amounts updated', payment: deletedPayment };
  } catch (error: any) {
    console.error('Error in deleteServicePayment:', error);
    return { status: 'error', code: 500, message: 'Failed to delete payment', errors: error.message };
  }
};

export const deleteService = async (id: number, db: any) => {
  try {
    const deleted = await db
      .deleteFrom("services")
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();

    if (!deleted) {
      return {
        status: "error",
        code: 404,
        message: "Service not found",
      };
    }

    return {
      status: "success",
      code: 200,
      message: "Service deleted successfully",
      data: deleted,
    };
  } catch (error: any) {
    console.error("Error in deleteService:", error);
    return {
      status: "error",
      code: 500,
      message: "Failed to delete service",
      errors: error.message,
    };
  }
};