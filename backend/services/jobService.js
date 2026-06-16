import { jobDao } from '../database/jobDao.js';

export const jobService = {
  async listActiveJobs() {
    return await jobDao.getAllActive();
  },

  async getJobDetails(id) {
    const job = await jobDao.getById(id);
    if (!job) {
      throw new Error(`Job with ID ${id} not found`);
    }
    return job;
  },

  async postNewJob(jobData) {
    // Basic business validation can be added here
    if (!jobData.title || !jobData.description) {
      throw new Error('Job title and description are required');
    }
    const insertId = await jobDao.create(jobData);
    return await jobDao.getById(insertId);
  },

  async listEmployerJobs(employerId) {
    return await jobDao.getByEmployer(employerId);
  },

  async editJob(id, employerId, jobData) {
    const updated = await jobDao.update(id, employerId, jobData);
    if (!updated) {
      throw new Error(`Job with ID ${id} not found or you are not authorized to update it`);
    }
    return await jobDao.getById(id);
  },

  async changeJobStatus(id, employerId, status) {
    const updated = await jobDao.updateStatus(id, employerId, status);
    if (!updated) {
      throw new Error(`Job with ID ${id} not found or you are not authorized to change its status`);
    }
    return await jobDao.getById(id);
  },

  async removeJob(id, employerId) {
    const deleted = await jobDao.delete(id, employerId);
    if (!deleted) {
      throw new Error(`Job with ID ${id} not found or you are not authorized to delete it`);
    }
    return { success: true, message: 'Job deleted successfully' };
  }
};
