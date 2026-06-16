export const aiValidation = {
  validateAtsScore(req, res, next) {
    const { jobId, applicationId } = req.body;
    
    if (!jobId || isNaN(Number(jobId))) {
      return res.status(400).json({ success: false, error: 'ValidationError', message: 'Valid jobId is required' });
    }

    if (!applicationId || isNaN(Number(applicationId))) {
      return res.status(400).json({ success: false, error: 'ValidationError', message: 'Valid applicationId is required' });
    }
    
    next();
  },

  validateRecommendations(req, res, next) {
    const jobId = Number(req.params.jobId);
    if (isNaN(jobId)) {
      return res.status(400).json({ success: false, error: 'ValidationError', message: 'Valid jobId parameter is required' });
    }
    next();
  }
};
