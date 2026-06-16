export const roleGuard = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== requiredRole) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `This action requires ${requiredRole} privileges`
      });
    }
    next();
  };
};

export const roleGuardMultiple = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `This action requires one of the following privileges: ${allowedRoles.join(', ')}`
      });
    }
    next();
  };
};
