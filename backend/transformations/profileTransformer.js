import { matchService } from '../services/matchService.js';

export const profileTransformer = {
  toResponse(profile) {
    if (!profile) return null;
    const parsed = {
      userId: profile.userId,
      name: profile.name,
      email: profile.email,
      avatarUrl: profile.avatarUrl || '/assets/default-avatar.png',
      role: profile.role,
      profileId: profile.profileId,
      resumeUrl: profile.resumeUrl || '',
      portfolioUrl: profile.portfolioUrl || '',
      bio: profile.bio || '',
      skills: Array.isArray(profile.skills) ? profile.skills : [],
      experience: profile.experience || {},
      education: Array.isArray(profile.education) ? profile.education : []
    };
    return {
      ...parsed,
      completionPercent: matchService.calculateProfileCompletion(parsed),
    };
  }
};
