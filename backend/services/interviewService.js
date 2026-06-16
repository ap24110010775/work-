import { interviewDao } from '../database/interviewDao.js';
import { applicationDao } from '../database/applicationDao.js';

export const interviewService = {
  async scheduleInterview(data) {
    const { applicationId, recruiterId, scheduledAt, durationMinutes, meetingLink, notes } = data;

    // Fetch the application to get candidateId and verify it exists
    const application = await applicationDao.getById(applicationId);
    if (!application) {
      throw new Error(`Application with ID ${applicationId} not found`);
    }

    const insertId = await interviewDao.create({
      applicationId,
      candidateId: application.candidateId,
      recruiterId,
      scheduledAt,
      durationMinutes,
      meetingLink,
      notes
    });

    // Also bump application status to 'interviewing'
    await applicationDao.updateStatus(applicationId, 'interviewing');

    return await interviewDao.getById(insertId);
  },

  async getCandidateInterviews(candidateId) {
    return await interviewDao.getByCandidate(candidateId);
  },

  async getEmployerInterviews(recruiterId) {
    return await interviewDao.getByRecruiter(recruiterId);
  },

  async updateInterviewStatus(id, status) {
    const interview = await interviewDao.getById(id);
    if (!interview) {
      throw new Error(`Interview with ID ${id} not found`);
    }
    await interviewDao.updateStatus(id, status);

    // If interview is completed, auto-update application to 'shortlisted' (or hired, but user requested shortlisted)
    if (status === 'completed') {
      await applicationDao.updateStatus(interview.applicationId, 'shortlisted');
    }

    return await interviewDao.getById(id);
  }
};
