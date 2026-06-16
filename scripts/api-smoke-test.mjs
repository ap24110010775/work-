import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = 'SmokePass123!';
const nextPassword = 'SmokePass456!';

const db = await mysql.createConnection({
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'workyaar',
});

const state = {
  candidateEmail: `codex-smoke-candidate-${runId}@workyaar.local`,
  employerEmail: `codex-smoke-employer-${runId}@workyaar.local`,
  adminEmail: `codex-smoke-admin-${runId}@workyaar.local`,
  candidateToken: '',
  employerToken: '',
  adminToken: '',
  jobId: 1,
  applicationId: null,
  interviewId: null,
  orderId: null,
};

const results = [];

async function request(method, path, { token, body } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return { status: res.status, ok: res.ok, data };
}

async function getOtp(email, purpose) {
  const [rows] = await db.execute(
    'SELECT otp_code FROM otps WHERE email = ? AND purpose = ? ORDER BY id DESC LIMIT 1',
    [email, purpose],
  );
  return rows[0]?.otp_code;
}

async function ensureAdmin() {
  await db.execute(
    `INSERT INTO users (provider, provider_user_id, role, name, email, password_hash, is_verified)
     VALUES ('local', ?, 'admin', 'Codex Smoke Admin', ?, ?, TRUE)`,
    [`admin-${runId}`, state.adminEmail, await hashPassword(password)],
  );
}

async function hashPassword(value) {
  const bcrypt = await import('bcrypt');
  return bcrypt.default.hash(value, 10);
}

function isExpectedStatus(actual, expected) {
  return Array.isArray(expected) ? expected.includes(actual) : actual === expected;
}

async function check(name, method, path, expected, options = {}) {
  try {
    const response = await request(method, path, options);
    const pass = isExpectedStatus(response.status, expected);
    results.push({
      name,
      method,
      path,
      expected: Array.isArray(expected) ? expected.join('/') : String(expected),
      status: response.status,
      pass,
      message: response.data?.message || response.data?.error || '',
    });
    return response;
  } catch (error) {
    results.push({
      name,
      method,
      path,
      expected: Array.isArray(expected) ? expected.join('/') : String(expected),
      status: 'ERR',
      pass: false,
      message: error.message,
    });
    return { status: 'ERR', ok: false, data: null };
  }
}

async function registerAndVerify(role, email) {
  await check(`auth register ${role}`, 'POST', '/api/v1/auth/register', 201, {
    body: { name: `Codex Smoke ${role}`, email, password, role },
  });
  const otp = await getOtp(email, 'verification');
  const verified = await check(`auth verify OTP ${role}`, 'POST', '/api/v1/auth/verify-otp', 200, {
    body: { email, otpCode: otp, purpose: 'verification' },
  });
  return verified.data?.token;
}

async function login(email, currentPassword, label) {
  const response = await check(`auth login ${label}`, 'POST', '/api/v1/auth/login', 200, {
    body: { email, password: currentPassword },
  });
  return response.data?.token;
}

async function main() {
  await check('health', 'GET', '/api/health', 200);

  state.candidateToken = await registerAndVerify('candidate', state.candidateEmail);
  state.employerToken = await registerAndVerify('employer', state.employerEmail);
  await ensureAdmin();
  state.adminToken = await login(state.adminEmail, password, 'admin');

  state.candidateToken = await login(state.candidateEmail, password, 'candidate');
  state.employerToken = await login(state.employerEmail, password, 'employer');

  await check('auth me candidate', 'GET', '/api/v1/auth/me', 200, { token: state.candidateToken });
  await check('auth google invalid token', 'POST', '/api/v1/auth/google', 401, {
    body: { idToken: 'invalid-token', role: 'candidate' },
  });

  await check('forgot password', 'POST', '/api/v1/auth/forgot-password', 200, {
    body: { email: state.candidateEmail },
  });
  const resetOtp = await getOtp(state.candidateEmail, 'reset');
  const resetPassword = await check('reset password', 'POST', '/api/v1/auth/reset-password', 200, {
    body: { email: state.candidateEmail, otpCode: resetOtp, newPassword: nextPassword },
  });
  const candidateTokenAfterReset = await login(
    state.candidateEmail,
    resetPassword.ok ? nextPassword : password,
    resetPassword.ok ? 'candidate after reset' : 'candidate after failed reset',
  );
  if (candidateTokenAfterReset) state.candidateToken = candidateTokenAfterReset;

  const jobs = await check('jobs list active', 'GET', '/api/v1/jobs', 200);
  state.jobId = jobs.data?.jobs?.[0]?.id || 1;
  await check('jobs get by id', 'GET', `/api/v1/jobs/${state.jobId}`, 200);

  const createdJob = await check('jobs create', 'POST', '/api/v1/jobs', 201, {
    token: state.employerToken,
    body: {
      title: `Codex Smoke Job ${runId}`,
      description: 'Temporary smoke-test job',
      requirements: 'Node.js, Express, MySQL',
      locationType: 'remote',
      jobType: 'full-time',
      location: 'Remote',
      salaryMin: 100000,
      salaryMax: 200000,
    },
  });
  const createdJobId = createdJob.data?.job?.id;
  if (createdJobId) state.jobId = createdJobId;

  await check('employer jobs', 'GET', '/api/v1/employer/jobs', 200, { token: state.employerToken });
  await check('jobs update', 'PUT', `/api/v1/jobs/${state.jobId}`, 200, {
    token: state.employerToken,
    body: {
      title: `Codex Smoke Job Updated ${runId}`,
      description: 'Temporary smoke-test job updated',
      requirements: 'Node.js, Express, MySQL',
      locationType: 'hybrid',
      jobType: 'full-time',
      location: 'Hyderabad',
      salaryMin: 110000,
      salaryMax: 210000,
      status: 'active',
    },
  });
  await check('jobs status', 'PATCH', `/api/v1/jobs/${state.jobId}/status`, 200, {
    token: state.employerToken,
    body: { status: 'active' },
  });

  await check('profile get candidate', 'GET', '/api/v1/profile', 200, { token: state.candidateToken });
  await check('profile update candidate', 'PUT', '/api/v1/profile', 200, {
    token: state.candidateToken,
    body: {
      name: 'Codex Smoke Candidate',
      bio: 'Temporary smoke profile',
      skills: ['Node.js', 'React'],
      experience: [],
      education: [],
      resumeUrl: 'https://example.com/resume.pdf',
    },
  });

  const application = await check('applications apply', 'POST', '/api/v1/applications', 201, {
    token: state.candidateToken,
    body: {
      jobId: state.jobId,
      resumeUrl: 'https://example.com/resume.pdf',
      coverLetter: 'Smoke test application',
    },
  });
  state.applicationId = application.data?.application?.id;

  await check('applications mine', 'GET', '/api/v1/applications/mine', 200, { token: state.candidateToken });
  await check('job applications', 'GET', `/api/v1/jobs/${state.jobId}/applications`, 200, { token: state.employerToken });
  await check('employer applications', 'GET', '/api/v1/employer/applications', 200, { token: state.employerToken });
  if (state.applicationId) {
    await check('application status update', 'PATCH', `/api/v1/applications/${state.applicationId}/status`, 200, {
      token: state.employerToken,
      body: { status: 'shortlisted' },
    });
  }

  await check('saved jobs save', 'POST', '/api/v1/saved-jobs', 201, {
    token: state.candidateToken,
    body: { jobId: state.jobId },
  });
  await check('saved jobs list', 'GET', '/api/v1/saved-jobs', 200, { token: state.candidateToken });
  await check('saved jobs ids', 'GET', '/api/v1/saved-jobs/ids', 200, { token: state.candidateToken });
  await check('saved jobs remove', 'DELETE', `/api/v1/saved-jobs/${state.jobId}`, 200, { token: state.candidateToken });

  const interview = await check('interviews schedule', 'POST', '/api/v1/interviews', 201, {
    token: state.employerToken,
    body: {
      applicationId: state.applicationId,
      candidateId: null,
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      durationMinutes: 30,
      meetingLink: 'https://example.com/meet',
      notes: 'Smoke test interview',
    },
  });
  state.interviewId = interview.data?.interview?.id;
  await check('interviews mine', 'GET', '/api/v1/interviews/mine', 200, { token: state.candidateToken });
  await check('employer interviews', 'GET', '/api/v1/employer/interviews', 200, { token: state.employerToken });
  if (state.interviewId) {
    await check('interview status update', 'PATCH', `/api/v1/interviews/${state.interviewId}/status`, 200, {
      token: state.employerToken,
      body: { status: 'completed' },
    });
  }

  await check('candidate stats', 'GET', '/api/v1/candidate/stats', 200, { token: state.candidateToken });
  await check('employer stats', 'GET', '/api/v1/employer/stats', 200, { token: state.employerToken });
  await check('admin stats', 'GET', '/api/v1/admin/stats', 200, { token: state.adminToken });

  const order = await check('payment create order', 'POST', '/api/v1/payments/create-order', 201, {
    token: state.employerToken,
    body: { plan: 'pro_monthly' },
  });
  state.orderId = order.data?.order?.orderId || order.data?.orderId;
  await check('payment verify', 'POST', '/api/v1/payments/verify', 200, {
    token: state.employerToken,
    body: {
      razorpayOrderId: state.orderId,
      razorpayPaymentId: `pay_mock_${runId}`,
      razorpaySignature: 'mock_signature',
      plan: 'pro_monthly',
    },
  });
  await check('payment subscription', 'GET', '/api/v1/payments/subscription', 200, { token: state.employerToken });
  await check('payment history', 'GET', '/api/v1/payments/history', 200, { token: state.employerToken });

  if (state.applicationId) {
    await check('ai ats score', 'POST', '/api/v1/ai/ats-score', 200, {
      token: state.employerToken,
      body: { jobId: state.jobId, applicationId: state.applicationId },
    });
  }
  await check('ai recommendations', 'GET', `/api/v1/employer/recommendations/${state.jobId}`, 200, {
    token: state.employerToken,
  });

  await check('company get', 'GET', '/api/v1/company', 200, { token: state.employerToken });
  await check('company update', 'PUT', '/api/v1/company', 200, {
    token: state.employerToken,
    body: {
      name: `Codex Smoke Company ${runId}`,
      description: 'Temporary smoke-test company',
      industry: 'Technology',
      location: 'Remote',
      employeeCount: '1-10',
      extraDetails: {},
    },
  });

  await check('admin users', 'GET', '/api/v1/admin/users', 200, { token: state.adminToken });
  await check('admin jobs', 'GET', '/api/v1/admin/jobs', 200, { token: state.adminToken });
  await check('admin companies', 'GET', '/api/v1/admin/companies', 200, { token: state.adminToken });

  await check('jobs delete', 'DELETE', `/api/v1/jobs/${state.jobId}`, 200, { token: state.employerToken });

  const passed = results.filter((result) => result.pass).length;
  const failed = results.length - passed;
  console.table(results.map(({ name, method, path, expected, status, pass, message }) => ({
    pass: pass ? 'PASS' : 'FAIL',
    name,
    method,
    path,
    expected,
    status,
    message,
  })));
  console.log(JSON.stringify({ total: results.length, passed, failed }, null, 2));

  if (failed > 0) {
    process.exitCode = 1;
  }
}

async function cleanup() {
  await db.execute(
    `DELETE FROM users
     WHERE email IN (?, ?, ?)`,
    [state.candidateEmail, state.employerEmail, state.adminEmail],
  );
}

try {
  await main();
} finally {
  await cleanup();
  await db.end();
}
