import { aiService } from '../services/aiService.js';

export const aiHandler = {
  async scoreResume(req, res, next) {
    try {
      const { jobId, applicationId } = req.body;
      const result = await aiService.getAtsScore(Number(jobId), Number(applicationId));
      
      return res.json({
        success: true,
        ats: result
      });
    } catch (error) {
      console.error('ATS Score Error:', error.message);
      return res.status(500).json({
        success: false,
        error: 'AtsError',
        message: error.message,
        hint: 'Make sure the jobId and applicationId exist in the database. Check your backend terminal for details.'
      });
    }
  },

  async recommendCandidates(req, res, next) {
    try {
      const jobId = Number(req.params.jobId);
      const recommendations = await aiService.getRecommendations(jobId);
      
      return res.json({
        success: true,
        recommendations
      });
    } catch (error) {
      console.error('Recommendations Error:', error.message);
      return res.status(500).json({
        success: false,
        error: 'RecommendationError',
        message: error.message
      });
    }
  }
};
