import { applicationDao } from '../database/applicationDao.js';
import { jobDao } from '../database/jobDao.js';
import { profileDao } from '../database/profileDao.js';

export const applicationService = {
  async applyToJob(appData) {
    const { jobId, candidateId } = appData;
    const jobExists = await jobDao.getById(jobId);
    if (!jobExists) {
      throw new Error(`Job with ID ${jobId} does not exist`);
    }

    // Auto-fill resume URL from candidate profile if missing
    if (!appData.resumeUrl) {
      const profile = await profileDao.getByUserId(candidateId);
      if (profile && profile.resumeUrl) {
        appData.resumeUrl = profile.resumeUrl;
      }
    }

    const insertId = await applicationDao.create(appData);
    return await applicationDao.getById(insertId);
  },

  async getCandidateApplications(candidateId) {
    return await applicationDao.getByCandidate(candidateId);
  },

  async getJobApplicants(jobId, employerId) {
    const job = await jobDao.getById(jobId);
    if (!job) {
      throw new Error(`Job with ID ${jobId} does not exist`);
    }

    if (Number(job.employerId) !== Number(employerId)) {
      throw new Error(`Job with ID ${jobId} does not exist`);
    }

    return await applicationDao.getByJob(jobId);
  },

  async updateApplicationStatus(id, status, employerId) {
    const application = await applicationDao.getById(id);
    if (!application) {
      throw new Error(`Application with ID ${id} not found`);
    }

    if (Number(application.employerId) !== Number(employerId)) {
      throw new Error(`Application with ID ${id} not found`);
    }

    await applicationDao.updateStatus(id, status);
    return await applicationDao.getById(id);
  },

  async getEmployerApplications(employerId) {
    return await applicationDao.getByEmployer(employerId);
  }
};
