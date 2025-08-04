export const createCustomer = async (body: any, db: any) => {
  try {
    const now = new Date();

    const newCustomer = await db
      .insertInto('customers') 
      .values({
        name: body.name,
        mobile_number: body.mobile_number,
        address: body.address,
        passport_number: body.passport_number,
        created_at: now
      })
      .returningAll()
      .executeTakeFirst(); 

    return {
      status: 'success',
      code: 201,
      message: 'Customer created successfully',
      data: newCustomer // Data returned after insertion
    };
  } catch (error) {
    console.error('Error in createCustomer service:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to create customer',
      errors: error.message
    };
  }
};

// export const updateCustomer = async (id: number, body: any, db: any) => {
//   try {
//     const updatedCustomer = await db
//       .updateTable('customers')
//       .set({
//         name: body.name,
//         mobile_number: body.mobile_number,
//         address: body.address,
//         passport_number: body.passport_number,
//         updated_at: new Date()
//       })
//       .where('id', '=', id)
//       .returningAll()
//       .executeTakeFirst();

//     if (!updatedCustomer) {
//       return {
//         status: 'error',
//         code: 404,
//         message: 'Customer record not found'
//       };
//     }

//     return {
//       status: 'success',
//       code: 200,
//       message: 'Customer record updated successfully',
//       data: updatedCustomer
//     };
//   } catch (error) {
//     console.error('Error in updateCustomer service:', error);
//     return {
//       status: 'error',
//       code: 500,
//       message: 'Failed to update customer record',
//       errors: error.message
//     };
//   }
// };

// export const deleteCustomer = async (id: number, db: any) => {
//   try {
//     const deletedCustomer = await db
//       .deleteFrom('customers')
//       .where('id', '=', id)
//       .returningAll()
//       .executeTakeFirst();

//     if (!deletedCustomer) {
//       return {
//         status: 'error',
//         code: 404,
//         message: 'Customer record not found'
//       };
//     }

//     return {
//       status: 'success',
//       code: 200,
//       message: 'Customer record deleted successfully'
//     };
//   } catch (error) {
//     console.error('Error in deleteCustomer service:', error);
//     return {
//       status: 'error',
//       code: 500,
//       message: 'Failed to delete customer record',
//       errors: error.message
//     };
//   }
// };

export const getAllCustomers = async (db: any) => {
  try {
    const customers = await db
      .selectFrom('customers')
      .select(['id', 'name', 'mobile_number'])
      .orderBy('created_at', 'desc')
      .execute();

    return {
      status: 'success',
      code: 200,
      message: 'Customers fetched successfully',
      data: customers
    };
  } catch (error) {
    console.error('Error in getAllCustomers service:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch customers',
      errors: error.message
    };
  }
};

export const getCustomerById = async (id: number, db: any) => {
  try {
    const customer = await db
      .selectFrom('customers')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!customer) {
      return {
        status: 'error',
        code: 404,
        message: 'Customer not found'
      };
    }

    return {
      status: 'success',
      code: 200,
      message: 'Customer fetched successfully',
      data: customer
    };
  } catch (error) {
    console.error('Error in getCustomerById service:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to fetch customer',
      errors: error.message
    };
  }
};