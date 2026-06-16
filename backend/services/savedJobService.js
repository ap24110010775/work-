import { savedJobDao } from '../database/savedJobDao.js';
import { jobDao } from '../database/jobDao.js';

export const savedJobService = {
  async saveJob(jobId, candidateId) {
    const jobExists = await jobDao.getById(jobId);
    if (!jobExists) {
      throw new Error(`Job with ID ${jobId} does not exist`);
    }
    await savedJobDao.save(jobId, candidateId);
    return { jobId, candidateId, saved: true };
  },

  async unsaveJob(jobId, candidateId) {
    const affected = await savedJobDao.remove(jobId, candidateId);
    if (affected === 0) {
      throw new Error(`Saved job with jobId ${jobId} not found for this user`);
    }
    return { jobId, candidateId, saved: false };
  },

  async getSavedJobs(candidateId) {
    return await savedJobDao.getByCandidate(candidateId);
  },

  async getSavedJobIds(candidateId) {
    return await savedJobDao.getSavedJobIds(candidateId);
  }
};
