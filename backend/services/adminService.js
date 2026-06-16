import { adminDao } from '../database/adminDao.js';

export const adminService = {
  async listAllUsers() {
    return await adminDao.getAllUsers();
  },

  async listAllJobs() {
    return await adminDao.getAllJobs();
  },

  async listAllCompanies() {
    return await adminDao.getAllCompanies();
  }
};
