import { z } from 'zod';

export const signupValidator = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters long').max(30, 'Username must be at most 30 characters long'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  email: z.string().email('Invalid email address')
});

export const validateRequest = (schema: any, data: any) => {
    try {
      schema.parse(data);
      return { success: true, errors: null };
    } catch (e) {
      return {
        success: false,
        errors: e.errors.map((error: any) => error.message), // Extract only the error messages
      };
    }
  };
  

  export const loginValidator = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters long'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
  });
  