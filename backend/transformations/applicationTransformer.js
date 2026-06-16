export const applicationTransformer = {
  toResponse(app) {
    if (!app) return null;
    return {
      id: app.id,
      jobId: app.jobId,
      status: app.status,
      appliedAt: app.appliedAt,
      coverLetter: app.coverLetter,
      // Map candidate detail objects if present
      candidate: app.candidateName ? {
        id: app.candidateId,
        name: app.candidateName,
        email: app.candidateEmail,
        avatar: app.candidateAvatar || '/assets/default-avatar.png',
        resumeUrl: app.resumeUrl
      } : null,
      // Map job detail objects if present
      job: app.jobTitle ? {
        title: app.jobTitle,
        jobType: app.jobType,
        locationType: app.locationType,
        location: app.jobLocation || 'Remote',
        company: {
          name: app.companyName || 'Independent Employer',
          logo: app.companyLogo || '/assets/default-company.png'
        }
      } : null
    };
  },

  toResponseList(apps) {
    if (!Array.isArray(apps)) return [];
    return apps.map(app => this.toResponse(app));
  }
};
