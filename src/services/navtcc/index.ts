export const createNavtcc = async (body: any, db: any) => {
    try {
      const now = new Date();
      
      const newNavtcc = await db
        .insertInto('navtcc')
        .values({
           employee_name: body.employee_name,
          customer_add: body.customer_add,
          reference: body.reference,
          profession_key: body.profession_key,
          passport_detail: body.passport_detail,
          receivable_amount: body.receivable_amount,
          paid_cash: body.paid_cash,
          paid_from_bank: body.paid_from_bank,
          paid_in_bank: body.paid_in_bank,
          profit: body.profit,
          remaining_amount: body.remaining_amount,
          created_at: now
          
        })
        .returningAll()
        .executeTakeFirst();
  
      return {
        status: 'success',
        code: 201,
        message: 'Navtcc created successfully',
        navtcc: newNavtcc,
      };
    } catch (error) {
      console.error('Error in createNavtcc service:', error);
      return {
        status: 'error',
        code: 500,
        message: 'Failed to create navtcc',
        errors: error.message
      };
    }
  };

  export const updateNavtcc = async (id: number, body: any, db: any) => {
    try {
      const now = new Date();
      const updatedNavtcc = await db
        .updateTable('navtcc')
        .set({
           employee_name: body.employee_name,
          customer_add: body.customer_add,
          reference: body.reference,
          profession_key: body.profession_key,
          passport_detail: body.passport_detail,
          receivable_amount: body.receivable_amount,
          paid_cash: body.paid_cash,
          paid_from_bank: body.paid_from_bank,
          paid_in_bank: body.paid_in_bank,
          profit: body.profit,
          remaining_amount: body.remaining_amount,
          created_at: now
        })
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirst();
  
      if (!updatedNavtcc) {
        return {
          status: 'error',
          code: 404,
          message: 'Navtcc not found',
        };
      }
  
      return {
        status: 'success',
        code: 200,
        message: 'Navtcc updated successfully',
        navtcc: updatedNavtcc,
      };
    } catch (error) {
      console.error('Error in updateNavtcc service:', error);
      return {
        status: 'error',
        code: 500,
        message: 'Failed to update ticket',
        errors: error.message,
      };
    }
  };
  

  export const deleteNavtcc  = async (id:number, db:any)=>{
    try{
      const deleteNavtcc =await db
     .deleteFrom('navtcc')  // Fixed from deleteForm to deleteFrom
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

      if(!deleteNavtcc){
        return {
          status:'error',
          code:404,
          message:'Navtcc not found'
        };
      }
      return {
        status:'success',
        code:200,
        message:'Navtcc deleted successfully',
        ticket:deleteNavtcc,
      };
    }
    catch(error){
      console.error("Error in deleteNavtcc service:",error)
      return {
        status:'error',
        code:500,
        message:'Failed to delete Navtcc',
        errors:error.message,
      };
    }
  };

  