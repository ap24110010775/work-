export const interviewValidation = {
  validateSchedule(req, res, next) {
    const { applicationId, scheduledAt, durationMinutes, meetingLink } = req.body;
    const errors = [];

    if (!applicationId || isNaN(Number(applicationId))) {
      errors.push('applicationId is required and must be a valid number');
    }

    if (!scheduledAt) {
      errors.push('scheduledAt (date and time) is required');
    } else {
      const scheduled = new Date(scheduledAt);
      if (isNaN(scheduled.getTime())) {
        errors.push('scheduledAt must be a valid date/time');
      } else if (scheduled.getTime() <= Date.now()) {
        errors.push('Interview must be scheduled in the future');
      }
    }

    const duration = Number(durationMinutes) || 30;
    if (duration < 15 || duration > 240) {
      errors.push('durationMinutes must be between 15 and 240');
    }

    if (meetingLink && typeof meetingLink === 'string' && meetingLink.trim()) {
      if (!/^https?:\/\/.+/i.test(meetingLink.trim())) {
        errors.push('Meeting link must be a valid http(s) URL');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: errors[0],
        details: errors,
      });
    }

    next();
  },
};
