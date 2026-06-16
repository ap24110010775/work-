export const interviewTransformer = {
  // For candidate view: shows company & job context
  toCandidateResponse(row) {
    if (!row) return null;
    return {
      id: row.id,
      scheduledAt: row.scheduledAt,
      durationMinutes: row.durationMinutes,
      meetingLink: row.meetingLink || null,
      status: row.status,
      notes: row.notes || '',
      job: {
        title: row.jobTitle,
        location: row.jobLocation || 'Remote',
        company: {
          name: row.companyName || 'Independent Employer',
          logo: row.companyLogo || '/assets/default-company.png'
        }
      },
      recruiter: {
        name: row.recruiterName || 'Recruiter',
        avatar: row.recruiterAvatar || '/assets/default-avatar.png'
      }
    };
  },

  // For employer view: shows candidate context
  toEmployerResponse(row) {
    if (!row) return null;
    return {
      id: row.id,
      scheduledAt: row.scheduledAt,
      durationMinutes: row.durationMinutes,
      meetingLink: row.meetingLink || null,
      status: row.status,
      notes: row.notes || '',
      job: { title: row.jobTitle },
      candidate: {
        name: row.candidateName,
        email: row.candidateEmail,
        avatar: row.candidateAvatar || '/assets/default-avatar.png'
      }
    };
  },

  toCandidateList(rows) {
    return (rows || []).map((r) => this.toCandidateResponse(r));
  },

  toEmployerList(rows) {
    return (rows || []).map((r) => this.toEmployerResponse(r));
  },

  // Minimal response after create/update (DB only has IDs at that point)
  toBasicResponse(row) {
    if (!row) return null;
    return {
      id: row.id,
      applicationId: row.applicationId,
      candidateId: row.candidateId,
      recruiterId: row.recruiterId,
      scheduledAt: row.scheduledAt,
      durationMinutes: row.durationMinutes,
      meetingLink: row.meetingLink || null,
      status: row.status,
      notes: row.notes || ''
    };
  }
};
