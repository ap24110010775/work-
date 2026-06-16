import { profileService } from '../services/profileService.js';
import { profileTransformer } from '../transformations/profileTransformer.js';
import { matchService } from '../services/matchService.js';

export const profileHandler = {
  // GET /api/v1/profile
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const profile = await profileService.getCandidateProfile(userId);
      return res.json({
        success: true,
        profile: profileTransformer.toResponse(profile)
      });
    } catch (error) {
      console.error('Error in getProfile:', error);
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
        message: 'Unable to retrieve user profile'
      });
    }
  },

  async uploadResume(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Resume file is required' });
      }

      const resumeUrl = `/uploads/resumes/${req.file.filename}`;
      const updatedProfile = await profileService.updateCandidateProfile(req.user.id, { resumeUrl });

      return res.json({
        success: true,
        message: 'Resume uploaded successfully',
        resumeUrl,
        profile: profileTransformer.toResponse(updatedProfile)
      });
    } catch (error) {
      console.error('Error uploading resume:', error);
      return res.status(500).json({ success: false, message: error.message || 'Unable to upload resume' });
    }
  },

  async getCompletion(req, res) {
    try {
      const profile = await profileService.getCandidateProfile(req.user.id);
      const percent = matchService.calculateProfileCompletion(profile);
      return res.json({ success: true, completionPercent: percent });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Unable to calculate profile completion' });
    }
  },

  // PUT /api/v1/profile
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;

      const updateData = {
        name: req.body.name,
        bio: req.body.bio,
        resumeUrl: req.body.resumeUrl,
        portfolioUrl: req.body.portfolioUrl,
        skills: req.body.skills,
        experience: req.body.experience,
        education: req.body.education
      };

      const updatedProfile = await profileService.updateCandidateProfile(userId, updateData);
      return res.json({
        success: true,
        message: 'Profile updated successfully',
        profile: profileTransformer.toResponse(updatedProfile)
      });
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return res.status(500).json({
        success: false,
        error: 'ServerError',
        message: 'Unable to update user profile'
      });
    }
  }
};
