/**
 * Role-based Authorization Middleware
 * 
 * Checks if the authenticated user has one of the allowed roles
 * Must be used after authenticateJWT middleware
 */
export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.userId || !req.role) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No user info found. Please authenticate first.'
      });
    }

    if (!allowedRoles.includes(req.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: You do not have access to this resource. Required roles: ${allowedRoles.join(', ')}`
      });
    }
    
    next();
  };
}
