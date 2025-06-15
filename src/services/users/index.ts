

import { encrypt, generateToken } from '../../utils/encryption';
import { loginValidator, signupValidator, validateRequest } from '../../validators';

export const signupUser = async (body: any, db: any) => {
  try {
    // Validate the input
    const { success, errors } = validateRequest(signupValidator, body);

    if (!success) {
      return {
        status: 'error',
        code: 400,
        message: 'Validation failed',
        errors,
      };
    }

    const { email, username, password } = body;

    // Check if username already exists
    const existingUser = await db
      .selectFrom('users')
      .where('username', '=', username)
      .selectAll()
      .executeTakeFirst();

    if (existingUser) {
      return {
        status: 'error',
        code: 409,
        message: 'Username already exists',
      };
    }

    const existingUserByEmail = await db
      .selectFrom('users')
      .where('email', '=', email)
      .selectAll()
      .executeTakeFirst();

    if (existingUserByEmail) {
      return {
        status: 'error',
        code: 409,
        message: 'Email already exists',
      };
    }

    // Hash the password
    const hashedPassword = await encrypt(password);

    // Insert the new user into the database
    const newUser = await db
      .insertInto('users')
      .values({
        email,
        username,
        password_hash: hashedPassword,
        role: 'employee', // Default to 'employee' if no role is specified
        isApproved: false, // Default to false if not specified
      })
      .returningAll()
      .executeTakeFirst();

    return {
      status: 'success',
      code: 201,
      message: 'User registered successfully, waiting for admin approval',
      user:{ id: newUser.id, username: newUser.username, email: newUser.email}
    };
  } catch (error) {
    console.error('Error during signup:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to create user',
      details: error.message, // Include detailed error message
    };
  }
};

// Temporary modification to loginUser function in index.ts
// Add this code temporarily to handle the plain text password for the admin

export const loginUser = async (data: any, db: any) => {
  const { email, password } = data;

  // Basic input validation
  if (!email || !password) {
    return {
      status: 'error',
      code: 400,
      message: 'Email and password are required',
    };
  }

  try {
    // Check if user exists
    const user = await db
      .selectFrom('users')
      .where('email', '=', email)
      .select(['id', 'username', 'email', 'password_hash', 'role', 'isApproved'])
      .executeTakeFirst();

    if (!user) {
      return {
        status: 'error',
        code: 404,
        message: 'User not found',
      };
    }

    // Check if user is approved
    if (!user.isApproved) {
      return {
        status: 'error',
        code: 403,
        message: 'Your account is pending approval. Please wait for admin approval.',
      };
    }

    // TEMPORARY: Special handling for admin with plain text password
    if (user.role === 'admin' && user.password_hash === password) {
      console.log('Admin logging in with plain text password - this should be updated!');
      
      // Generate token
      const token = await generateToken({ userId: user.id, username: user.username, role: user.role });
      
      return {
        status: 'success',
        code: 200,
        message: 'Login successful',
        token,
        role: user.role,
      };
    }

    // Normal password check for other users
    const encryptedPassword = await encrypt(password);
    
    // For debugging, you can log the values (remove in production)
    console.log('Input encrypted:', encryptedPassword);
    console.log('Stored hash:', user.password_hash);

    if (encryptedPassword !== user.password_hash) {
      return {
        status: 'error',
        code: 401,
        message: 'Invalid password',
      };
    }

    // Generate token
    const token = await generateToken({ userId: user.id, username: user.username, role: user.role });

    return {
      status: 'success',
      code: 200,
      message: 'Login successful',
      token,
      role: user.role,
    };
  } catch (error) {
    console.error('Error during login:', error);
    return {
      status: 'error',
      code: 500,
      message: 'An error occurred during login',
      details: error.message,
    };
  }
};

export const getPendingUsers = async (db: any) => {
  try {
    // Fetch all users with isApproved = false
    const pendingUsers = await db
      .selectFrom('users')
      .where('isApproved', '=', false)
      .select(['id', 'username', 'email', 'role'])
      .execute();

    return {
      status: 'success',
      code: 200,
      message: 'Pending users retrieved successfully',
      users: pendingUsers,
    };
  } catch (error) {
    console.error('Error fetching pending users:', error);
    return {
      status: 'error',
      code: 500,
      message: 'Failed to retrieve pending users',
      details: error.message,
    };
  }
};