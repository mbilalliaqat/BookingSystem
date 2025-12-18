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