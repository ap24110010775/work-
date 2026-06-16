import { profileDao } from '../database/profileDao.js';

export const profileService = {
  async getCandidateProfile(userId) {
    const profile = await profileDao.getByUserId(userId);
    if (!profile) {
      throw new Error(`User with ID ${userId} not found`);
    }
    return this.parseJSONFields(profile);
  },

  async updateCandidateProfile(userId, data) {
    const updated = await profileDao.update(userId, data);
    return this.parseJSONFields(updated);
  },

  parseJSONFields(profile) {
    if (!profile) return null;
    return {
      ...profile,
      skills: typeof profile.skills === 'string' ? JSON.parse(profile.skills) : (profile.skills || []),
      experience: typeof profile.experience === 'string' ? JSON.parse(profile.experience) : (profile.experience || {}),
      education: typeof profile.education === 'string' ? JSON.parse(profile.education) : (profile.education || [])
    };
  }
};
