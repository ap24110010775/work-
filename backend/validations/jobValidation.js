export const jobValidation = {
  validateCreate(req, res, next) {
    const { title, description, locationType, jobType } = req.body;

    const errors = [];
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      errors.push('Title is required and must be a non-empty string.');
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      errors.push('Description is required and must be a non-empty string.');
    }
    
    // Check location types against enum values
    const validLocationTypes = ['remote', 'hybrid', 'onsite'];
    if (locationType && !validLocationTypes.includes(locationType)) {
      errors.push(`locationType must be one of: ${validLocationTypes.join(', ')}`);
    }

    // Check job types against enum values
    const validJobTypes = ['full-time', 'part-time', 'internship', 'gig'];
    if (jobType && !validJobTypes.includes(jobType)) {
      errors.push(`jobType must be one of: ${validJobTypes.join(', ')}`);
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Invalid request payload',
        details: errors
      });
    }

    next();
  }
};
