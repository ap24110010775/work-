import { matchService } from '../services/matchService.js';

export const matchHandler = {
  async candidateJobMatches(req, res) {
    try {
      const matches = await matchService.getCandidateJobMatches(req.user.id);
      return res.json({ success: true, matches });
    } catch (error) {
      console.error('Job matches error:', error.message);
      return res.status(500).json({ success: false, message: 'Unable to calculate job matches' });
    }
  },

  async suggestSkills(req, res) {
    try {
      const q = String(req.query.q || '');
      const suggestions = matchService.suggestSkills(q);
      return res.json({ success: true, suggestions });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Unable to fetch skill suggestions' });
    }
  },
};
