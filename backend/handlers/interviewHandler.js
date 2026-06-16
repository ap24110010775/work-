import { interviewService } from '../services/interviewService.js';
import { interviewTransformer } from '../transformations/interviewTransformer.js';

const VALID_STATUSES = ['scheduled', 'completed', 'cancelled', 'rescheduled'];

export const interviewHandler = {
  // POST /api/v1/interviews
  async schedule(req, res) {
    try {
      const { applicationId, scheduledAt, durationMinutes, meetingLink, notes } = req.body;

      if (!applicationId || isNaN(Number(applicationId))) {
        return res.status(400).json({
          success: false,
          error: 'ValidationError',
          message: 'applicationId is required and must be a valid number'
        });
      }
      if (!scheduledAt) {
        return res.status(400).json({
          success: false,
          error: 'ValidationError',
          message: 'scheduledAt (ISO date string) is required'
        });
      }

      const recruiterId = req.user.id;

      const interview = await interviewService.scheduleInterview({
        applicationId: Number(applicationId),
        recruiterId,
        scheduledAt: new Date(scheduledAt),
        durationMinutes: Number(durationMinutes) || 30,
        meetingLink,
        notes
      });

      return res.status(201).json({
        success: true,
        message: 'Interview scheduled successfully',
        interview: interviewTransformer.toBasicResponse(interview)
      });
    } catch (error) {
      console.error('Error scheduling interview:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, error: 'NotFound', message: error.message });
      }
      return res.status(500).json({ success: false, error: 'ServerError', message: 'Unable to schedule interview' });
    }
  },

  // GET /api/v1/interviews/mine  (candidate)
  async listMine(req, res) {
    try {
      const candidateId = req.user.id;
      const rows = await interviewService.getCandidateInterviews(candidateId);
      return res.json({
        success: true,
        count: rows.length,
        interviews: interviewTransformer.toCandidateList(rows)
      });
    } catch (error) {
      console.error('Error fetching candidate interviews:', error);
      return res.status(500).json({ success: false, error: 'ServerError', message: 'Unable to retrieve interviews' });
    }
  },

  // GET /api/v1/employer/interviews  (employer)
  async listEmployer(req, res) {
    try {
      const recruiterId = req.user.id;
      const rows = await interviewService.getEmployerInterviews(recruiterId);
      return res.json({
        success: true,
        count: rows.length,
        interviews: interviewTransformer.toEmployerList(rows)
      });
    } catch (error) {
      console.error('Error fetching employer interviews:', error);
      return res.status(500).json({ success: false, error: 'ServerError', message: 'Unable to retrieve employer interviews' });
    }
  },

  // PATCH /api/v1/interviews/:id/status
  async updateStatus(req, res) {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'BadRequest', message: 'Interview ID must be a valid number' });
      }
      if (!status || !VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'ValidationError',
          message: `status must be one of: ${VALID_STATUSES.join(', ')}`
        });
      }

      const updated = await interviewService.updateInterviewStatus(id, status);
      return res.json({
        success: true,
        message: `Interview status updated to ${status}`,
        interview: interviewTransformer.toBasicResponse(updated)
      });
    } catch (error) {
      console.error('Error updating interview status:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, error: 'NotFound', message: error.message });
      }
      return res.status(500).json({ success: false, error: 'ServerError', message: 'Unable to update interview status' });
    }
  }
};
