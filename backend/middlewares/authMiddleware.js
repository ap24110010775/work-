import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Missing authentication token'
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'change-me-in-production';
    const payload = jwt.verify(token, jwtSecret);
    
    // Attach the user context to the request
    req.user = {
      id: payload.userId,
      role: payload.role
    };
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }
};
