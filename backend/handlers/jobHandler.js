import { jobService } from '../services/jobService.js';
import { jobTransformer } from '../transformations/jobTransformer.js';
import { companyDao } from '../database/companyDao.js';

export const jobHandler = {
  async listActive(req, res) {
    try {
      const dbJobs = await jobService.listActiveJobs();
      const clientJobs = jobTransformer.toResponseList(dbJobs);
      return res.json({
        success: true,
        count: clientJobs.length,
        jobs: clientJobs
      });
    } catch (error) {
      console.error('Error fetching active jobs:', error);
      return res.status(500).json({
        success: false,
        error: 'ServerError',
        message: 'Unable to retrieve jobs'
      });
    }
  },

  async getById(req, res) {
    try {
      const jobId = Number(req.params.id);
      if (isNaN(jobId)) {
        return res.status(400).json({
          success: false,
          error: 'BadRequest',
          message: 'Job ID must be a valid number'
        });
      }
      const dbJob = await jobService.getJobDetails(jobId);
      const clientJob = jobTransformer.toResponse(dbJob);
      return res.json({
        success: true,
        job: clientJob
      });
    } catch (error) {
      console.error(`Error fetching job details for ID ${req.params.id}:`, error);
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
        message: 'Unable to retrieve job details'
      });
    }
  },

  async create(req, res) {
    try {
      const employerId = req.user.id;
      const company = await companyDao.ensureCompanyExists(employerId, null);

      const jobData = {
        ...req.body,
        employerId,
        companyId: company?.id || null
      };

      const newJob = await jobService.postNewJob(jobData);
      const clientJob = jobTransformer.toResponse(newJob);

      return res.status(201).json({
        success: true,
        message: 'Job posted successfully',
        job: clientJob
      });
    } catch (error) {
      console.error('Error creating job:', error);
      return res.status(500).json({
        success: false,
        error: 'ServerError',
        message: 'Unable to create job'
      });
    }
  },

  async listEmployer(req, res) {
    try {
      const dbJobs = await jobService.listEmployerJobs(req.user.id);
      const clientJobs = jobTransformer.toResponseList(dbJobs);
      return res.json({
        success: true,
        jobs: clientJobs
      });
    } catch (error) {
      console.error('Error listing employer jobs:', error);
      return res.status(500).json({
        success: false,
        error: 'ServerError',
        message: 'Unable to retrieve employer jobs'
      });
    }
  },

  async update(req, res) {
    try {
      const employerId = req.user.id;
      const jobId = Number(req.params.id);
      if (isNaN(jobId)) {
        return res.status(400).json({
          success: false,
          error: 'BadRequest',
          message: 'Job ID must be a valid number'
        });
      }

      const updatedJob = await jobService.editJob(jobId, employerId, req.body);
      const clientJob = jobTransformer.toResponse(updatedJob);
      return res.json({
        success: true,
        message: 'Job updated successfully',
        job: clientJob
      });
    } catch (error) {
      console.error(`Error updating job ${req.params.id}:`, error);
      if (error.message.includes('not found') || error.message.includes('authorized')) {
        return res.status(404).json({
          success: false,
          error: 'NotFoundOrUnauthorized',
          message: error.message
        });
      }
      return res.status(500).json({
        success: false,
        error: 'ServerError',
        message: 'Unable to update job'
      });
    }
  },

  async updateStatus(req, res) {
    try {
      const employerId = req.user.id;
      const jobId = Number(req.params.id);
      const { status } = req.body;
      if (isNaN(jobId)) {
        return res.status(400).json({
          success: false,
          error: 'BadRequest',
          message: 'Job ID must be a valid number'
        });
      }
      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'BadRequest',
          message: 'Status is required'
        });
      }

      const updatedJob = await jobService.changeJobStatus(jobId, employerId, status);
      const clientJob = jobTransformer.toResponse(updatedJob);
      return res.json({
        success: true,
        message: `Job status updated to ${status}`,
        job: clientJob
      });
    } catch (error) {
      console.error(`Error updating job status for ${req.params.id}:`, error);
      if (error.message.includes('not found') || error.message.includes('authorized')) {
        return res.status(404).json({
          success: false,
          error: 'NotFoundOrUnauthorized',
          message: error.message
        });
      }
      return res.status(500).json({
        success: false,
        error: 'ServerError',
        message: 'Unable to update job status'
      });
    }
  },

  async delete(req, res) {
    try {
      const employerId = req.user.id;
      const jobId = Number(req.params.id);
      if (isNaN(jobId)) {
        return res.status(400).json({
          success: false,
          error: 'BadRequest',
          message: 'Job ID must be a valid number'
        });
      }

      const response = await jobService.removeJob(jobId, employerId);
      return res.json({
        success: true,
        ...response
      });
    } catch (error) {
      console.error(`Error deleting job ${req.params.id}:`, error);
      if (error.message.includes('not found') || error.message.includes('authorized')) {
        return res.status(404).json({
          success: false,
          error: 'NotFoundOrUnauthorized',
          message: error.message
        });
      }
      return res.status(500).json({
        success: false,
        error: 'ServerError',
        message: 'Unable to delete job'
      });
    }
  }
};
