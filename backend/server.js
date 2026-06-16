// ============================================================
// ALL IMPORTS AT THE TOP (ES Module requirement)
// ============================================================
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './database/db.js';
import compression from 'compression';

// Phase 1 — Middleware imports
import { requestContext } from './middlewares/requestContext.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { globalLimiter, authLimiter } from './middlewares/rateLimiter.js';
import { errorMiddleware } from './middlewares/errorMiddleware.js';
import { authMiddleware } from './middlewares/authMiddleware.js';
import { roleGuard } from './middlewares/roleGuard.js';

// Phase 2 — Auth
import { authHandler } from './handlers/authHandler.js';
import { authValidation } from './validations/authValidation.js';

// Feature handlers
import { jobHandler } from './handlers/jobHandler.js';
import { jobValidation } from './validations/jobValidation.js';
import { statsHandler } from './handlers/statsHandler.js';
import { applicationHandler } from './handlers/applicationHandler.js';
import { applicationValidation } from './validations/applicationValidation.js';
import { profileHandler } from './handlers/profileHandler.js';
import { profileValidation } from './validations/profileValidation.js';
import { savedJobHandler } from './handlers/savedJobHandler.js';
import { interviewHandler } from './handlers/interviewHandler.js';
import { interviewValidation } from './validations/interviewValidation.js';
import { companyHandler } from './handlers/companyHandler.js';
import { companyValidation } from './validations/companyValidation.js';
import { adminHandler } from './handlers/adminHandler.js';

// Phase 4 — AI
import { aiHandler } from './handlers/aiHandler.js';
import { aiValidation } from './validations/aiValidation.js';
import { matchHandler } from './handlers/matchHandler.js';
import { resumeUpload } from './middlewares/uploadMiddleware.js';
import { messageHandler } from './handlers/messageHandler.js';

// Phase 5 — Payments
import { paymentHandler } from './handlers/paymentHandler.js';
import { paymentValidation } from './validations/paymentValidation.js';
import { subscriptionGuard } from './middlewares/subscriptionGuard.js';

// ============================================================
// APP SETUP
// ============================================================
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 4000);

// ============================================================
// GLOBAL MIDDLEWARE PIPELINE (Phase 1)
// ============================================================
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
app.use(compression());
app.use(express.json());
app.use(requestContext);
app.use(requestLogger);
app.use(globalLimiter);

// Serve uploaded resumes and assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================
// PUBLIC ROUTES (No auth required)
// ============================================================
app.get('/api/v1/jobs', jobHandler.listActive);
app.get('/api/v1/jobs/:id', jobHandler.getById);

// Auth Routes (Phase 2)
app.post('/api/v1/auth/register', authLimiter, authValidation.validateRegister, authHandler.register);
app.post('/api/v1/auth/login', authLimiter, authValidation.validateLogin, authHandler.login);
app.post('/api/v1/auth/verify-otp', authLimiter, authValidation.validateOtp, authHandler.verifyOtp);
app.post('/api/v1/auth/google', authLimiter, authHandler.googleLogin);

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    const [rows] = await pool.execute('SELECT 1 + 1 AS connectionTest');
    return res.json({ ok: true, status: 'healthy', database: 'connected', testResult: rows[0].connectionTest });
  } catch (error) {
    return res.status(500).json({ ok: false, status: 'unhealthy', database: 'disconnected', error: error.message });
  }
});

// ============================================================
// PROTECTED ROUTES (Auth required)
// ============================================================

// Auth — Get current user
app.post('/api/v1/auth/forgot-password', authValidation.validateForgotPassword, authHandler.forgotPassword);
app.post('/api/v1/auth/reset-password', authValidation.validateResetPassword, authHandler.resetPassword);
app.get('/api/v1/auth/me', authMiddleware, authHandler.getMe);

// Jobs — Employer only
app.post('/api/v1/jobs', authMiddleware, roleGuard('employer'), jobValidation.validateCreate, jobHandler.create);
app.get('/api/v1/employer/jobs', authMiddleware, roleGuard('employer'), jobHandler.listEmployer);
app.put('/api/v1/jobs/:id', authMiddleware, roleGuard('employer'), jobValidation.validateCreate, jobHandler.update);
app.patch('/api/v1/jobs/:id/status', authMiddleware, roleGuard('employer'), jobHandler.updateStatus);
app.delete('/api/v1/jobs/:id', authMiddleware, roleGuard('employer'), jobHandler.delete);

// Stats
app.get('/api/v1/candidate/stats', authMiddleware, roleGuard('candidate'), statsHandler.candidateStats);
app.get('/api/v1/employer/stats', authMiddleware, roleGuard('employer'), statsHandler.employerStats);
app.get('/api/v1/admin/stats', authMiddleware, roleGuard('admin'), statsHandler.adminStats);

// Applications
app.post('/api/v1/applications', authMiddleware, roleGuard('candidate'), applicationValidation.validateCreate, applicationHandler.apply);
app.get('/api/v1/applications/mine', authMiddleware, roleGuard('candidate'), applicationHandler.listMine);
app.get('/api/v1/jobs/:jobId/applications', authMiddleware, roleGuard('employer'), applicationHandler.listJobApplicants);
app.get('/api/v1/employer/applications', authMiddleware, roleGuard('employer'), applicationHandler.listEmployerApplications);
app.patch('/api/v1/applications/:id/status', authMiddleware, roleGuard('employer'), applicationValidation.validateStatusUpdate, applicationHandler.updateStatus);

// Profile
app.get('/api/v1/profile', authMiddleware, profileHandler.getProfile);
app.get('/api/v1/profile/completion', authMiddleware, profileHandler.getCompletion);
app.post('/api/v1/profile/resume', authMiddleware, (req, res, next) => {
  resumeUpload.single('resume')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'Invalid resume file' });
    }
    next();
  });
}, profileHandler.uploadResume);
app.put('/api/v1/profile', authMiddleware, profileValidation.validateUpdate, profileHandler.updateProfile);

// Matching & skills
app.get('/api/v1/candidate/job-matches', authMiddleware, roleGuard('candidate'), matchHandler.candidateJobMatches);
app.get('/api/v1/skills/suggest', authMiddleware, matchHandler.suggestSkills);

// Saved Jobs
app.post('/api/v1/saved-jobs', authMiddleware, roleGuard('candidate'), savedJobHandler.save);
app.get('/api/v1/saved-jobs', authMiddleware, roleGuard('candidate'), savedJobHandler.list);
app.get('/api/v1/saved-jobs/ids', authMiddleware, roleGuard('candidate'), savedJobHandler.listIds);
app.delete('/api/v1/saved-jobs/:jobId', authMiddleware, roleGuard('candidate'), savedJobHandler.remove);

// Interviews
app.post('/api/v1/interviews', authMiddleware, roleGuard('employer'), interviewValidation.validateSchedule, interviewHandler.schedule);
app.get('/api/v1/interviews/mine', authMiddleware, roleGuard('candidate'), interviewHandler.listMine);
app.get('/api/v1/employer/interviews', authMiddleware, roleGuard('employer'), interviewHandler.listEmployer);
app.patch('/api/v1/interviews/:id/status', authMiddleware, roleGuard('employer'), interviewHandler.updateStatus);

// AI Routes — available to authenticated users (local scoring fallback when AI key unavailable)
app.post('/api/v1/ai/ats-score', authMiddleware, aiValidation.validateAtsScore, aiHandler.scoreResume);
app.get('/api/v1/employer/recommendations/:jobId', authMiddleware, roleGuard('employer'), aiValidation.validateRecommendations, aiHandler.recommendCandidates);

// Payment Routes (Phase 5)
app.post('/api/v1/payments/create-order', authMiddleware, paymentValidation.validateCreateOrder, paymentHandler.createOrder);
app.post('/api/v1/payments/verify', authMiddleware, paymentValidation.validateVerifyPayment, paymentHandler.verifyPayment);
app.get('/api/v1/payments/subscription', authMiddleware, paymentHandler.getSubscription);
app.get('/api/v1/payments/status/:orderId', authMiddleware, paymentHandler.getOrderStatus);
app.get('/api/v1/payments/history', authMiddleware, paymentHandler.getPaymentHistory);

// Messages
app.get('/api/v1/messages/inbox', authMiddleware, messageHandler.getInbox);
app.get('/api/v1/messages/thread/:applicationId', authMiddleware, messageHandler.getThread);
app.post('/api/v1/messages', authMiddleware, messageHandler.send);

// Company
app.get('/api/v1/company', authMiddleware, roleGuard('employer'), companyHandler.getCompany);
app.put('/api/v1/company', authMiddleware, roleGuard('employer'), companyValidation.validateUpdate, companyHandler.updateCompany);

// Admin
app.get('/api/v1/admin/users', authMiddleware, roleGuard('admin'), adminHandler.listUsers);
app.get('/api/v1/admin/jobs', authMiddleware, roleGuard('admin'), adminHandler.listJobs);
app.get('/api/v1/admin/companies', authMiddleware, roleGuard('admin'), adminHandler.listCompanies);

// ============================================================
// GLOBAL ERROR HANDLER (MUST be last)
// ============================================================
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`✅ WorkYaar backend running on http://localhost:${port}`);
});