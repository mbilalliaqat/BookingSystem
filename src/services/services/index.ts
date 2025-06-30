import { incrementEntryCounts } from "../counters";

export const createService = async (body: any, db: any) => {
    try {
      const [currentEntryNumber] = body.entry.split('/').map(Number);
      
      const newService = await db
        .insertInto('services')
        .values({
          user_name: body.user_name,
          entry: body.entry,
          customer_add: body.customer_add,
          booking_date: body.booking_date,
          specific_detail: body.specific_detail,
          receivable_amount: body.receivable_amount,
          paid_cash: body.paid_cash,
          paid_in_bank: body.paid_in_bank,
          profit: body.profit,
          remaining_amount: body.remaining_amount,
          visa_type: body.visa_type
        })
        .returningAll()
        .executeTakeFirst();

         if (newService) {
              await incrementEntryCounts('services', currentEntryNumber, db); // Update entry_counters table
            }
  
      return {
        status: 'success',
        code: 201,
        message: 'Service created successfully',
        service: newService
      };
    } catch (error) {
      console.error('Error in createService:', error);
      return {
        status: 'error',
        code: 500,
        message: 'Failed to create service',
        errors: error.message
      };
    }
  };
  
  export const getServices = async (db: any) => {
    try {
      const services = await db
        .selectFrom('services')
        .selectAll()
        .execute();
  
      return {
        status: 'success',
        code: 200,
        services: services
      };
    } catch (error) {
      console.error('Error in getServices:', error);
      return {
        status: 'error',
        code: 500,
        message: 'Failed to fetch services',
        errors: error.message
      };
    }
  };
  
  export const getServiceById = async (id: number, db: any) => {
    try {
      const service = await db
        .selectFrom('services')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
  
      if (!service) {
        return {
          status: 'error',
          code: 404,
          message: 'Service not found'
        };
      }
  
      return {
        status: 'success',
        code: 200,
        service: service
      };
    } catch (error) {
      console.error('Error in getServiceById:', error);
      return {
        status: 'error',
        code: 500,
        message: 'Failed to fetch service',
        errors: error.message
      };
    }
  };
  
  export const updateService = async (id: number, body: any, db: any) => {
    try {
      const updatedService = await db
        .updateTable('services')
        .set({
          user_name: body.user_name,
          entry: body.entry,
          customer_add: body.customer_add,
          booking_date: body.booking_date,
          specific_detail: body.specific_detail,
          receivable_amount: body.receivable_amount,
          paid_cash: body.paid_cash,
          paid_in_bank: body.paid_in_bank,
          profit: body.profit,
          remaining_amount: body.remaining_amount,
          visa_type: body.visa_type
        })
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
  
      if (!updatedService) {
        return {
          status: 'error',
          code: 404,
          message: 'Service not found'
        };
      }
  
      return {
        status: 'success',
        code: 200,
        message: 'Service updated successfully',
        service: updatedService
      };
    } catch (error) {
      console.error('Error in updateService:', error);
      return {
        status: 'error',
        code: 500,
        message: 'Failed to update service',
        errors: error.message
      };
    }
  };
  
  export const deleteService = async (id: number, db: any) => {
    try {
      const deletedService = await db
        .deleteFrom('services')
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
  
      if (!deletedService) {
        return {
          status: 'error',
          code: 404,
          message: 'Service not found'
        };
      }
  
      return {
        status: 'success',
        code: 200,
        message: 'Service deleted successfully',
        service: deletedService
      };
    } catch (error) {
      console.error('Error in deleteService:', error);
      return {
        status: 'error',
        code: 500,
        message: 'Failed to delete service',
        errors: error.message
      };
    }
  };