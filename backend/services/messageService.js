import { messageDao } from '../database/messageDao.js';
import { applicationDao } from '../database/applicationDao.js';

export const messageService = {
  async getThread(applicationId, userId) {
    const app = await applicationDao.getById(applicationId);
    if (!app) throw new Error('Application not found');

    const isEmployer = Number(app.employerId) === Number(userId);
    const isCandidate = Number(app.candidateId) === Number(userId);
    if (!isEmployer && !isCandidate) {
      throw new Error('You are not authorized to view this conversation');
    }

    await messageDao.markThreadRead(applicationId, userId);
    const messages = await messageDao.getThread(applicationId);
    return { applicationId, messages, jobId: app.jobId, candidateId: app.candidateId, employerId: app.employerId };
  },

  async getInbox(userId) {
    return messageDao.getInboxForUser(userId);
  },

  async sendMessage(senderId, { applicationId, body }) {
    if (!body || typeof body !== 'string' || body.trim().length < 1) {
      throw new Error('Message body is required');
    }
    if (body.trim().length > 2000) {
      throw new Error('Message must be 2000 characters or less');
    }

    const app = await applicationDao.getById(applicationId);
    if (!app) throw new Error('Application not found');

    const isEmployer = Number(app.employerId) === Number(senderId);
    const isCandidate = Number(app.candidateId) === Number(senderId);
    if (!isEmployer && !isCandidate) {
      throw new Error('You are not authorized to message on this application');
    }

    const receiverId = isEmployer ? app.candidateId : app.employerId;
    const messageId = await messageDao.create({
      applicationId,
      senderId,
      receiverId,
      body: body.trim(),
    });

    return messageDao.getById(messageId);
  },
};
