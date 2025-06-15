import { decodeToken, verifyToken } from "./utils/encryption";

export const checkLogin = async (c: any, next: any) => {
    let authorized = false;
    let token = c.req.header('Authorization') || c.req.query('token');
    if (token?.startsWith('Bearer ')) {
        token = token.slice(7);
    }
    
    if (token) {
        try {
            const verify = await verifyToken(token);

            if (verify) {
            
                const payload = decodeToken(token);
                
                if (payload?.userId) {
                    
                    c.set('user', payload);
                    authorized = true;
                }
            }
        } catch (e: any) {
            // eslint-disable-next-line no-undef
            console.error(e);
        }
    }
    return authorized ? next() : c.text('Login Required', 401);
};

export const checkRole = (allowedRoles: string[]) => async (c: any, next: any) => {
    const user = c.get('user');
    if (!user || !allowedRoles.includes(user.role)) {
      return c.text('Unauthorized', 403);
    }
    return next();
  };

//  Middleware for admin-only routes
  export const adminOnly = async (c: any, next: any) => {
      const user = c.get('user');
      if (!user || user.role !== 'admin') {
        return c.json({
          status: 'error',
          code: 403,
          message: 'Admin access required',
        }, 403);
      }
      return next();
  };