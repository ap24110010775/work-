import { statsService } from '../services/statsService.js';

export const statsHandler = {
  // GET /api/v1/candidate/stats
  async candidateStats(req, res) {
    try {
      const candidateId = req.user.id; // From JWT via authMiddleware
      const stats = await statsService.getCandidateStats(candidateId);
      return res.json({ success: true, stats });
    } catch (error) {
      console.error('Error fetching candidate stats:', error);
      return res.status(500).json({
        success: false,
        error: 'ServerError',
        message: 'Unable to retrieve candidate stats',
      });
    }
  },

  // GET /api/v1/employer/stats
  async employerStats(req, res) {
    try {
      const employerId = req.user.id; // From JWT via authMiddleware
      const stats = await statsService.getEmployerStats(employerId);
      return res.json({ success: true, stats });
    } catch (error) {
      console.error('Error fetching employer stats:', error);
      return res.status(500).json({
        success: false,
        error: 'ServerError',
        message: 'Unable to retrieve employer stats',
      });
    }
  },

  // GET /api/v1/admin/stats
  async adminStats(req, res) {
    try {
      const stats = await statsService.getAdminStats();
      return res.json({ success: true, stats });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      return res.status(500).json({
        success: false,
        error: 'ServerError',
        message: 'Unable to retrieve admin stats',
      });
    }
  },
};
