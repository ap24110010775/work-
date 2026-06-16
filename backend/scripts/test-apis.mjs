/**
 * Comprehensive API test runner for WorkYaar backend
 * Usage: node backend/scripts/test-apis.mjs
 */
const BASE = 'http://localhost:4000';

const results = { pass: [], fail: [], skip: [] };

async function req(method, path, { body, token, expectStatus } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  let data;
  try {
    data = await res.json();
  } catch {
    data = { _raw: await res.text() };
  }
  return { status: res.status, data };
}

function ok(name, condition, detail = '') {
  if (condition) {
    results.pass.push(name);
    console.log(`✅ ${name}${detail ? ` — ${detail}` : ''}`);
  } else {
    results.fail.push({ name, detail });
    console.log(`❌ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function skip(name, reason) {
  results.skip.push({ name, reason });
  console.log(`⏭️  ${name} — ${reason}`);
}

// ── Test state ──
const ts = Date.now();
const employerEmail = `test-employer-${ts}@workyaar.test`;
const candidateEmail = `test-candidate-${ts}@workyaar.test`;
const password = 'TestPass123!';
let employerToken, candidateToken;
let employerId, candidateId;
let jobId, applicationId;
let otpFromDb = null;

async function getLatestOtp(email) {
  const mysql = await import('mysql2/promise');
  const dotenv = await import('dotenv');
  const { fileURLToPath } = await import('url');
  const { dirname, join } = await import('path');
  const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', '.env');
  dotenv.config({ path: envPath });
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'workyaar',
  });
  const [rows] = await pool.execute(
    'SELECT otp_code FROM otps WHERE email = ? ORDER BY created_at DESC LIMIT 1',
    [email]
  );
  await pool.end();
  return rows[0]?.otp_code;
}

async function runTests() {
  console.log('\n🔍 WorkYaar API Test Suite\n' + '='.repeat(50));

  // ── Health ──
  {
    const { status, data } = await req('GET', '/api/health');
    ok('GET /api/health', status === 200 && data.ok === true, `status=${status}`);
  }

  // ── Public jobs ──
  {
    const { status, data } = await req('GET', '/api/v1/jobs');
    ok('GET /api/v1/jobs', status === 200 && data.success !== false, `count=${data.jobs?.length ?? '?'}`);
    if (data.jobs?.length) {
      const { status: s2, data: d2 } = await req('GET', `/api/v1/jobs/${data.jobs[0].id}`);
      ok('GET /api/v1/jobs/:id', s2 === 200 && d2.job, `id=${data.jobs[0].id}`);
    }
  }

  // ── Register employer ──
  {
    const { status, data } = await req('POST', '/api/v1/auth/register', {
      body: { name: 'Test Employer', email: employerEmail, password, role: 'employer' },
    });
    ok('POST /api/v1/auth/register (employer)', status === 201, JSON.stringify(data).slice(0, 80));
    employerId = data.userId;
  }

  // ── Register candidate ──
  {
    const { status, data } = await req('POST', '/api/v1/auth/register', {
      body: { name: 'Test Candidate', email: candidateEmail, password, role: 'candidate' },
    });
    ok('POST /api/v1/auth/register (candidate)', status === 201, JSON.stringify(data).slice(0, 80));
    candidateId = data.userId;
  }

  // ── Verify OTPs ──
  {
    const empOtp = await getLatestOtp(employerEmail);
    const { status, data } = await req('POST', '/api/v1/auth/verify-otp', {
      body: { email: employerEmail, otpCode: empOtp },
    });
    ok('POST /api/v1/auth/verify-otp (employer)', status === 200 && data.token, `token=${!!data.token}`);
    employerToken = data.token;
    employerId = data.user?.id || employerId;
  }

  {
    const candOtp = await getLatestOtp(candidateEmail);
    const { status, data } = await req('POST', '/api/v1/auth/verify-otp', {
      body: { email: candidateEmail, otpCode: candOtp },
    });
    ok('POST /api/v1/auth/verify-otp (candidate)', status === 200 && data.token, `token=${!!data.token}`);
    candidateToken = data.token;
    candidateId = data.user?.id || candidateId;
  }

  // ── Login ──
  {
    const { status, data } = await req('POST', '/api/v1/auth/login', {
      body: { email: employerEmail, password },
    });
    ok('POST /api/v1/auth/login (employer)', status === 200 && data.token, `role=${data.user?.role}`);
    employerToken = data.token;
  }

  // ── Auth me ──
  {
    const { status, data } = await req('GET', '/api/v1/auth/me', { token: employerToken });
    ok('GET /api/v1/auth/me', status === 200 && data.user?.email === employerEmail);
  }

  // ── Forgot / reset password ──
  {
    const { status } = await req('POST', '/api/v1/auth/forgot-password', {
      body: { email: candidateEmail },
    });
    ok('POST /api/v1/auth/forgot-password', status === 200);
    const resetOtp = await getLatestOtp(candidateEmail);
    const { status: s2, data: d2 } = await req('POST', '/api/v1/auth/reset-password', {
      body: { email: candidateEmail, otpCode: resetOtp, newPassword: 'NewPass456!' },
    });
    ok('POST /api/v1/auth/reset-password', s2 === 200, d2.message?.slice(0, 60));
    // Login with new password
    const { status: s3, data: d3 } = await req('POST', '/api/v1/auth/login', {
      body: { email: candidateEmail, password: 'NewPass456!' },
    });
    ok('POST /api/v1/auth/login (after reset)', s3 === 200 && d3.token);
    candidateToken = d3.token;
  }

  // ── Google login (mock) ──
  {
    const jwt = await import('jsonwebtoken');
    const mockToken = jwt.default.sign(
      { email: `google-user-${ts}@workyaar.test`, name: 'Google User', sub: `google-${ts}` },
      'mock-secret'
    );
    const { status, data } = await req('POST', '/api/v1/auth/google', {
      body: { idToken: mockToken, role: 'candidate' },
    });
    // Will fail with real GOOGLE_CLIENT_ID — that's expected
    if (status === 200) {
      ok('POST /api/v1/auth/google', true, 'mock token accepted');
    } else {
      skip('POST /api/v1/auth/google', `status=${status} (real Google verification required)`);
    }
  }

  // ── Employer: create job ──
  {
    const { status, data } = await req('POST', '/api/v1/jobs', {
      token: employerToken,
      body: {
        title: 'API Test Engineer',
        description: 'Testing all WorkYaar APIs end to end.',
        requirements: 'Node.js, Express, MySQL, Testing',
        locationType: 'remote',
        jobType: 'full-time',
        location: 'Remote',
        salaryMin: 500000,
        salaryMax: 900000,
      },
    });
    ok('POST /api/v1/jobs', status === 201 || status === 200, JSON.stringify(data).slice(0, 100));
    jobId = data.job?.id || data.id;
  }

  // ── Employer jobs list ──
  {
    const { status, data } = await req('GET', '/api/v1/employer/jobs', { token: employerToken });
    ok('GET /api/v1/employer/jobs', status === 200, `jobs=${data.jobs?.length}`);
    if (!jobId && data.jobs?.length) jobId = data.jobs[0].id;
  }

  // ── Stats ──
  {
    const { status, data } = await req('GET', '/api/v1/employer/stats', { token: employerToken });
    ok('GET /api/v1/employer/stats', status === 200 && data.stats, JSON.stringify(data.stats || {}).slice(0, 80));
  }
  {
    const { status, data } = await req('GET', '/api/v1/candidate/stats', { token: candidateToken });
    ok('GET /api/v1/candidate/stats', status === 200 && data.stats, JSON.stringify(data.stats).slice(0, 80));
  }

  // ── Profile ──
  {
    const { status, data } = await req('GET', '/api/v1/profile', { token: candidateToken });
    ok('GET /api/v1/profile', status === 200, JSON.stringify(data).slice(0, 80));
    const { status: s2 } = await req('PUT', '/api/v1/profile', {
      token: candidateToken,
      body: { bio: 'API test bio', skills: ['Node.js', 'React'] },
    });
    ok('PUT /api/v1/profile', s2 === 200);
  }

  // ── Company ──
  {
    const { status, data } = await req('GET', '/api/v1/company', { token: employerToken });
    ok('GET /api/v1/company', status === 200 || status === 404, JSON.stringify(data).slice(0, 80));
    const { status: s2 } = await req('PUT', '/api/v1/company', {
      token: employerToken,
      body: { name: 'Test Corp API', industry: 'Technology', location: 'Remote' },
    });
    ok('PUT /api/v1/company', s2 === 200 || s2 === 201);
  }

  // ── Saved jobs ──
  if (jobId) {
    const { status } = await req('POST', '/api/v1/saved-jobs', {
      token: candidateToken,
      body: { jobId },
    });
    ok('POST /api/v1/saved-jobs', status === 200 || status === 201);
    const { status: s2, data: d2 } = await req('GET', '/api/v1/saved-jobs', { token: candidateToken });
    ok('GET /api/v1/saved-jobs', s2 === 200, `count=${d2.savedJobs?.length ?? d2.jobs?.length}`);
    const { status: s3 } = await req('GET', '/api/v1/saved-jobs/ids', { token: candidateToken });
    ok('GET /api/v1/saved-jobs/ids', s3 === 200);
  }

  // ── Apply to job ──
  if (jobId) {
    const { status, data } = await req('POST', '/api/v1/applications', {
      token: candidateToken,
      body: { jobId, coverLetter: 'I am interested in this role.' },
    });
    ok('POST /api/v1/applications', status === 200 || status === 201, JSON.stringify(data).slice(0, 80));
    applicationId = data.application?.id || data.id;
  }

  // ── Applications lists ──
  {
    const { status, data } = await req('GET', '/api/v1/applications/mine', { token: candidateToken });
    ok('GET /api/v1/applications/mine', status === 200, `count=${data.applications?.length}`);
    if (!applicationId && data.applications?.length) applicationId = data.applications[0].id;
  }
  {
    const { status, data } = await req('GET', '/api/v1/employer/applications', { token: employerToken });
    ok('GET /api/v1/employer/applications', status === 200, `count=${data.applications?.length}`);
  }
  if (jobId) {
    const { status, data } = await req('GET', `/api/v1/jobs/${jobId}/applications`, { token: employerToken });
    ok('GET /api/v1/jobs/:jobId/applications', status === 200, `count=${data.applications?.length}`);
  }

  // ── Update application status ──
  if (applicationId) {
    const { status, data } = await req('PATCH', `/api/v1/applications/${applicationId}/status`, {
      token: employerToken,
      body: { status: 'shortlisted' },
    });
    ok('PATCH /api/v1/applications/:id/status', status === 200, JSON.stringify(data).slice(0, 80));
  }

  // ── Interviews ──
  if (applicationId) {
    const { status, data } = await req('POST', '/api/v1/interviews', {
      token: employerToken,
      body: {
        applicationId,
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        durationMinutes: 30,
        meetingLink: 'https://meet.example.com/test',
        notes: 'API test interview',
      },
    });
    ok('POST /api/v1/interviews', status === 200 || status === 201, JSON.stringify(data).slice(0, 80));
  }
  {
    const { status, data } = await req('GET', '/api/v1/interviews/mine', { token: candidateToken });
    ok('GET /api/v1/interviews/mine', status === 200, JSON.stringify(data).slice(0, 60));
  }
  {
    const { status, data } = await req('GET', '/api/v1/employer/interviews', { token: employerToken });
    ok('GET /api/v1/employer/interviews', status === 200, JSON.stringify(data).slice(0, 60));
  }

  // ── Payments (mock mode) ──
  {
    const { status, data } = await req('POST', '/api/v1/payments/create-order', {
      token: employerToken,
      body: { plan: 'pro_monthly' },
    });
    ok('POST /api/v1/payments/create-order', status === 201 || status === 200, JSON.stringify(data).slice(0, 100));

    if (data.order) {
      const orderId = data.order.orderId || data.order.id;
      const { status: s2, data: d2 } = await req('POST', '/api/v1/payments/verify', {
        token: employerToken,
        body: {
          razorpayOrderId: orderId,
          razorpayPaymentId: 'mock_payment',
          razorpaySignature: 'mock_sig',
          plan: 'pro_monthly',
        },
      });
      ok('POST /api/v1/payments/verify', s2 === 200, d2.message?.slice(0, 60));
    }
  }
  {
    const { status, data } = await req('GET', '/api/v1/payments/subscription', { token: employerToken });
    ok('GET /api/v1/payments/subscription', status === 200, JSON.stringify(data.subscription).slice(0, 80));
  }
  {
    const { status, data } = await req('GET', '/api/v1/payments/history', { token: employerToken });
    ok('GET /api/v1/payments/history', status === 200, `count=${data.payments?.length}`);
  }

  // ── AI (requires Pro) ──
  if (jobId && applicationId) {
    const { status, data } = await req('POST', '/api/v1/ai/ats-score', {
      token: employerToken,
      body: { jobId, applicationId },
    });
    ok('POST /api/v1/ai/ats-score', status === 200 && data.ats, JSON.stringify(data).slice(0, 100));

    const { status: s2, data: d2 } = await req('GET', `/api/v1/employer/recommendations/${jobId}`, {
      token: employerToken,
    });
    ok('GET /api/v1/employer/recommendations/:jobId', s2 === 200, JSON.stringify(d2).slice(0, 80));
  }

  // ── Job update/delete ──
  if (jobId) {
    const { status } = await req('PATCH', `/api/v1/jobs/${jobId}/status`, {
      token: employerToken,
      body: { status: 'paused' },
    });
    ok('PATCH /api/v1/jobs/:id/status', status === 200);
  }

  // ── Summary ──
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Passed: ${results.pass.length}`);
  console.log(`❌ Failed: ${results.fail.length}`);
  console.log(`⏭️  Skipped: ${results.skip.length}`);
  if (results.fail.length) {
    console.log('\nFailures:');
    results.fail.forEach((f) => console.log(`  - ${f.name}: ${f.detail}`));
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});
