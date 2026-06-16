import { applicationService } from '../services/applicationService.js';
import { applicationTransformer } from '../transformations/applicationTransformer.js';

export const applicationHandler = {
  // POST /api/v1/applications
  async apply(req, res) {
    try {
      const candidateId = req.user.id;

      const appData = {
        jobId: Number(req.body.jobId),
        candidateId: candidateId,
        resumeUrl: req.body.resumeUrl,
        coverLetter: req.body.coverLetter
      };

      const newApp = await applicationService.applyToJob(appData);
      return res.status(201).json({
        success: true,
        message: 'Successfully applied to job',
        application: applicationTransformer.toResponse(newApp)
      });
    } catch (error) {
      console.error('Error applying to job:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          error: 'Conflict',
          message: 'You have already applied to this job'
        });
      }
      if (error.message.includes('does not exist')) {
        return res.status(404).json({
          success: false,
          error: 'NotFound',
          message: error.message
        });
      }
      return res.status(500).json({
        success: false,
        error: 'ServerError',
        message: 'Unable to process job application'
      });
    }
  },

  // GET /api/v1/applications/mine
  async listMine(req, res, next) {
    try {
      const candidateId = req.user.id;
      const dbApps = await applicationService.getCandidateApplications(candidateId);
      return res.json({
        success: true,
        count: dbApps.length,
        applications: applicationTransformer.toResponseList(dbApps)
      });
    } catch (error) {
      console.error('Error fetching candidate applications:', error);
      return res.status(500).json({
        success: false,
        error: 'ServerError',
        message: 'Unable to retrieve your applications'
      });
    }
  },

  // GET /api/v1/jobs/:jobId/applications
  async listJobApplicants(req, res) {
    try {
      const jobId = Number(req.params.jobId);
      if (isNaN(jobId)) {
        return res.status(400).json({
          success: false,
          error: 'BadRequest',
          message: 'Job ID must be a valid number'
        });
      }

      const employerId = req.user.id;

      const dbApps = await applicationService.getJobApplicants(jobId, employerId);
      return res.json({
        success: true,
        count: dbApps.length,
        applications: applicationTransformer.toResponseList(dbApps)
      });
    } catch (error) {
      console.error(`Error fetching applicants for job ${req.params.jobId}:`, error);
      if (error.message.includes('does not exist')) {
        return res.status(404).json({
          success: false,
          error: 'NotFound',
          message: error.message
        });
      }
      return res.status(500).json({
        success: false,
        error: 'ServerError',
        message: 'Unable to retrieve job applicants'
      });
    }
  },

  // PATCH /api/v1/applications/:id/status
  async updateStatus(req, res, next) {
    try {
      const employerId = req.user.id;
      const appId = Number(req.params.id);
      const { status } = req.body;
      if (isNaN(appId)) {
        return res.status(400).json({
          success: false,
          error: 'BadRequest',
          message: 'Application ID must be a valid number'
        });
      }

      const updatedApp = await applicationService.updateApplicationStatus(appId, status, employerId);
      return res.json({
        success: true,
        message: `Application status updated to ${status}`,
        application: applicationTransformer.toResponse(updatedApp)
      });
    } catch (error) {
      console.error(`Error updating application status for ${req.params.id}:`, error);
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'NotFound',
          message: error.message
        });
      }
      return res.status(500).json({
        success: false,
        error: 'ServerError',
        message: 'Unable to update application status'
      });
    }
  },

  // GET /api/v1/employer/applications
  async listEmployerApplications(req, res, next) {
    try {
      const employerId = req.user.id;
      const dbApps = await applicationService.getEmployerApplications(employerId);
      return res.json({
        success: true,
        count: dbApps.length,
        applications: applicationTransformer.toResponseList(dbApps)
      });
    } catch (error) {
      console.error('Error fetching employer applications:', error);
      return res.status(500).json({
        success: false,
        error: 'ServerError',
        message: 'Unable to retrieve employer applications'
      });
    }
  }
};
