export const profileValidation = {
  validateUpdate(req, res, next) {
    const { name, skills, experience, education } = req.body;

    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Name must be a valid, non-empty string'
      });
    }

    if (skills !== undefined && !Array.isArray(skills)) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Skills must be an array of strings'
      });
    }

    if (education !== undefined && !Array.isArray(education)) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Education must be a valid array'
      });
    }

    next();
  }
};
