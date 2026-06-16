import { statsDao } from '../database/statsDao.js';

export const statsService = {
  async getCandidateStats(candidateId) {
    return await statsDao.getCandidateStats(candidateId);
  },

  async getEmployerStats(employerId) {
    return await statsDao.getEmployerStats(employerId);
  },

  async getAdminStats() {
    return await statsDao.getAdminStats();
  },
};
