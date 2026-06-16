import { messageService } from '../services/messageService.js';

export const messageHandler = {
  async getInbox(req, res) {
    try {
      const threads = await messageService.getInbox(req.user.id);
      return res.json({ success: true, threads });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Unable to load inbox' });
    }
  },

  async getThread(req, res) {
    try {
      const applicationId = Number(req.params.applicationId);
      if (isNaN(applicationId)) {
        return res.status(400).json({ success: false, message: 'Invalid application ID' });
      }
      const thread = await messageService.getThread(applicationId, req.user.id);
      return res.json({ success: true, ...thread });
    } catch (error) {
      if (error.message.includes('not authorized') || error.message.includes('not found')) {
        return res.status(403).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: 'Unable to load messages' });
    }
  },

  async send(req, res) {
    try {
      const { applicationId, body } = req.body;
      if (!applicationId) {
        return res.status(400).json({ success: false, message: 'applicationId is required' });
      }
      const message = await messageService.sendMessage(req.user.id, {
        applicationId: Number(applicationId),
        body,
      });
      return res.status(201).json({ success: true, message: 'Message sent', data: message });
    } catch (error) {
      if (error.message.includes('required') || error.message.includes('authorized') || error.message.includes('not found')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: 'Unable to send message' });
    }
  },
};
