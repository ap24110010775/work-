CREATE DATABASE IF NOT EXISTS workyaar;
USE workyaar;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider VARCHAR(32) NOT NULL,
  provider_user_id VARCHAR(191) NULL,
  role ENUM('candidate', 'employer', 'admin') NOT NULL DEFAULT 'candidate',
  name VARCHAR(191) NOT NULL,
  email VARCHAR(191) NOT NULL,
  avatar_url TEXT NULL,
  password_hash VARCHAR(255) NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_provider_user (provider, provider_user_id),
  UNIQUE KEY unique_email_provider (email, provider)
);

-- 1.5 OTPs Table (For Email Verification & Password Reset)
CREATE TABLE IF NOT EXISTS otps (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(191) NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  purpose ENUM('verification', 'reset', 'login') NOT NULL DEFAULT 'verification',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_email_otp (email, otp_code)
);

-- 2. Social Login Log
CREATE TABLE IF NOT EXISTS social_login_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  provider VARCHAR(32) NOT NULL,
  logged_in_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_social_login_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Company Profiles
CREATE TABLE IF NOT EXISTS companies (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  employer_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(191) NOT NULL,
  description TEXT NULL,
  logo_url TEXT NULL,
  website VARCHAR(191) NULL,
  industry VARCHAR(100) NULL,
  location VARCHAR(191) NULL,
  employee_count VARCHAR(50) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_company_employer FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Candidate Profiles
CREATE TABLE IF NOT EXISTS candidate_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  resume_url TEXT NULL,
  portfolio_url TEXT NULL,
  bio TEXT NULL,
  skills JSON NULL, -- Array of skills, e.g. ["React", "Node.js"]
  experience JSON NULL, -- Structured experience history
  education JSON NULL, -- Structured education history
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Jobs Listings
CREATE TABLE IF NOT EXISTS jobs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id BIGINT UNSIGNED NULL,
  employer_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(191) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT NULL,
  location_type ENUM('remote', 'hybrid', 'onsite') NOT NULL DEFAULT 'onsite',
  job_type ENUM('full-time', 'part-time', 'internship', 'gig') NOT NULL DEFAULT 'full-time',
  location VARCHAR(191) NULL,
  salary_min DECIMAL(12, 2) NULL,
  salary_max DECIMAL(12, 2) NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  status ENUM('draft', 'active', 'paused', 'closed') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_job_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
  CONSTRAINT fk_job_employer FOREIGN KEY (employer_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_jobs_filter (status, location_type, job_type)
);

-- 6. Applications Tracker
CREATE TABLE IF NOT EXISTS applications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  job_id BIGINT UNSIGNED NOT NULL,
  candidate_id BIGINT UNSIGNED NOT NULL,
  resume_url TEXT NULL,
  cover_letter TEXT NULL,
  status ENUM('applied', 'shortlisted', 'interviewing', 'rejected', 'hired') NOT NULL DEFAULT 'applied',
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_job_candidate (job_id, candidate_id),
  CONSTRAINT fk_app_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_app_candidate FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Saved/Bookmarked Jobs
CREATE TABLE IF NOT EXISTS saved_jobs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  job_id BIGINT UNSIGNED NOT NULL,
  candidate_id BIGINT UNSIGNED NOT NULL,
  saved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_saved_job (job_id, candidate_id),
  CONSTRAINT fk_saved_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_saved_candidate FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. Scheduled Interviews
CREATE TABLE IF NOT EXISTS interviews (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  application_id BIGINT UNSIGNED NOT NULL,
  candidate_id BIGINT UNSIGNED NOT NULL,
  recruiter_id BIGINT UNSIGNED NOT NULL,
  scheduled_at TIMESTAMP NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 30,
  meeting_link TEXT NULL,
  status ENUM('scheduled', 'completed', 'cancelled', 'rescheduled') NOT NULL DEFAULT 'scheduled',
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_interview_app FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  CONSTRAINT fk_interview_candidate FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_interview_recruiter FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. Subscriptions (Phase 5 — WorkYaar Pro)
CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  plan ENUM('free', 'pro_monthly', 'pro_yearly') NOT NULL DEFAULT 'free',
  status ENUM('active', 'expired', 'cancelled') NOT NULL DEFAULT 'active',
  starts_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_sub_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sub_user_status (user_id, status)
);

-- 10. Payment Records (Phase 5)
CREATE TABLE IF NOT EXISTS payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  subscription_id BIGINT UNSIGNED NULL,
  razorpay_order_id VARCHAR(255) NOT NULL,
  razorpay_payment_id VARCHAR(255) NULL,
  razorpay_signature VARCHAR(255) NULL,
  amount_inr DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  status ENUM('created', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'created',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_payment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_sub FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
);

-- 11. Employer-Candidate Messages
CREATE TABLE IF NOT EXISTS messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  application_id BIGINT UNSIGNED NOT NULL,
  sender_id BIGINT UNSIGNED NOT NULL,
  receiver_id BIGINT UNSIGNED NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_messages_application (application_id),
  INDEX idx_messages_receiver (receiver_id),
  CONSTRAINT fk_message_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  CONSTRAINT fk_message_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_message_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);