export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized: No user info found' });
    }

    if (!allowedRoles.includes(req.role)) {
      return res.status(403).json({ message: 'Forbidden: You do not have access to this resource' });
    }
    
    next();
  };
}
