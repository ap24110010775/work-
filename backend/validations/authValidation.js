export const authValidation = {
  validateRegister(req, res, next) {
    const { name, email, password } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'ValidationError', message: 'Valid name is required' });
    }
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'ValidationError', message: 'Valid email is required' });
    }
    
    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, error: 'ValidationError', message: 'Password must be at least 8 characters long' });
    }
    
    next();
  },

  validateLogin(req, res, next) {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'ValidationError', message: 'Email and password are required' });
    }
    
    next();
  },

  validateOtp(req, res, next) {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({ success: false, error: 'ValidationError', message: 'Email and OTP code are required' });
    }

    // Default to email verification when purpose is omitted
    if (!req.body.purpose) {
      req.body.purpose = 'verification';
    }

    next();
  },

  validateForgotPassword(req, res, next) {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'ValidationError', message: 'Valid email is required' });
    }
    next();
  },

  validateResetPassword(req, res, next) {
    const { email, otpCode, newPassword } = req.body;
    if (!email || !otpCode || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'ValidationError', message: 'Email, OTP code, and a new password (min 8 chars) are required' });
    }
    next();
  }
};
