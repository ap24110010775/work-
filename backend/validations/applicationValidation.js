export const applicationValidation = {
  validateCreate(req, res, next) {
    const { jobId } = req.body;
    
    if (!jobId || isNaN(Number(jobId))) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'jobId is required and must be a valid number.'
      });
    }
    
    next();
  },

  validateStatusUpdate(req, res, next) {
    const { status } = req.body;
    const validStatuses = ['applied', 'shortlisted', 'interviewing', 'rejected', 'hired'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: `status is required and must be one of: ${validStatuses.join(', ')}`
      });
    }

    next();
  }
};
