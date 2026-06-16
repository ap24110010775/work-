import { adminService } from '../services/adminService.js';

export const adminHandler = {
  async listUsers(req, res) {
    try {
      const users = await adminService.listAllUsers();
      return res.json({
        success: true,
        users
      });
    } catch (error) {
      console.error('Error fetching admin users:', error);
      return res.status(500).json({ success: false, error: 'ServerError', message: 'Unable to retrieve users' });
    }
  },

  async listJobs(req, res) {
    try {
      const jobs = await adminService.listAllJobs();
      return res.json({
        success: true,
        jobs
      });
    } catch (error) {
      console.error('Error fetching admin jobs:', error);
      return res.status(500).json({ success: false, error: 'ServerError', message: 'Unable to retrieve jobs' });
    }
  },

  async listCompanies(req, res) {
    try {
      const companies = await adminService.listAllCompanies();
      return res.json({
        success: true,
        companies
      });
    } catch (error) {
      console.error('Error fetching admin companies:', error);
      return res.status(500).json({ success: false, error: 'ServerError', message: 'Unable to retrieve companies' });
    }
  }
};
