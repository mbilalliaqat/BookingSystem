import { incrementEntryCounts } from "../counters";

const formatDateForDB = (dateStr: string | null | undefined): string | null => {
  if (!dateStr || dateStr.trim() === "") return null;
  return dateStr;
};

export const createNavtcc = async (body: any, db: any) => {
  try {
    const now = new Date();
    const entryNumber = body.entry?.split("/")[0] ? parseInt(body.entry.split("/")[0]) : null;

    const newNavtcc = await db
      .insertInto("navtcc")
      .values({
        employee_name: body.employee_name,
        customer_add: body.customer_add,
        entry: body.entry,
        reference: body.reference,
        profession_key: body.profession_key,
        booking_date: formatDateForDB(body.booking_date),
        remaining_date: formatDateForDB(body.remaining_date),
        passport_detail: body.passport_detail,
        receivable_amount: parseFloat(body.receivable_amount) || 0,
        paid_cash: parseFloat(body.paid_cash) || 0,
        paid_from_bank: body.paid_from_bank || null,
        paid_in_bank: parseFloat(body.paid_in_bank) || 0,
        payed_to_bank: parseFloat(body.payed_to_bank) || 0,
        profit: parseFloat(body.profit) || 0,
        remaining_amount: parseFloat(body.remaining_amount) || 0,
        vendors: body.vendors || null, // Already JSON string from frontend
        agent_name: body.agent_name || null,
        created_at: now,
        updated_at: now,
      })
      .returningAll()
      .executeTakeFirst();

    if (newNavtcc && entryNumber) {
      await incrementEntryCounts("navtcc", entryNumber, db);
    }

    return {
      status: "success",
      code: 201,
      message: "NAVTCC created successfully",
      data: newNavtcc,
    };
  } catch (error: any) {
    console.error("Error in createNavtcc:", error);
    return {
      status: "error",
      code: 500,
      message: "Failed to create NAVTCC record",
      errors: error.message,
    };
  }
};

export const updateNavtcc = async (id: number, body: any, db: any) => {
  try {
    const now = new Date();

    const updatedNavtcc = await db
      .updateTable("navtcc")
      .set({
        employee_name: body.employee_name,
        customer_add: body.customer_add,
        entry: body.entry,
        reference: body.reference,
        profession_key: body.profession_key,
        booking_date: formatDateForDB(body.booking_date),
        remaining_date: formatDateForDB(body.remaining_date),
        passport_detail: body.passport_detail,
        receivable_amount: parseFloat(body.receivable_amount) || 0,
        paid_cash: parseFloat(body.paid_cash) || 0,
        paid_from_bank: body.paid_from_bank || null,
        paid_in_bank: parseFloat(body.paid_in_bank) || 0,
        payed_to_bank: parseFloat(body.payed_to_bank) || 0,
        profit: parseFloat(body.profit) || 0,
        remaining_amount: parseFloat(body.remaining_amount) || 0,
        vendors: body.vendors || null,
        agent_name: body.agent_name || null,
        updated_at: now, // Only update updated_at, preserve created_at
      })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();

    if (!updatedNavtcc) {
      return {
        status: "error",
        code: 404,
        message: "NAVTCC record not found",
      };
    }

    return {
      status: "success",
      code: 200,
      message: "NAVTCC updated successfully",
      data: updatedNavtcc,
    };
  } catch (error: any) {
    console.error("Error in updateNavtcc:", error);
    return {
      status: "error",
      code: 500,
      message: "Failed to update NAVTCC record",
      errors: error.message,
    };
  }
};

export const deleteNavtcc = async (id: number, db: any) => {
  try {
    const deleted = await db
      .deleteFrom("navtcc")
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();

    if (!deleted) {
      return {
        status: "error",
        code: 404,
        message: "NAVTCC record not found",
      };
    }

    return {
      status: "success",
      code: 200,
      message: "NAVTCC deleted successfully",
      data: deleted,
    };
  } catch (error: any) {
    console.error("Error in deleteNavtcc:", error);
    return {
      status: "error",
      code: 500,
      message: "Failed to delete NAVTCC record",
      errors: error.message,
    };
  }
};