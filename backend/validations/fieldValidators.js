// Shared field validators for company and profile forms

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
const URL_REGEX = /^https?:\/\/.+\..+/i;
const EMPLOYER_TYPES = ['Direct Employer', 'Agency'];
const HIRING_STATUSES = ['Active', 'Paused'];
const EMPLOYEE_COUNTS = ['1-10', '11-50', '51-200', '201-500', '500+'];

export function validateGstNumber(gst) {
  if (!gst || !String(gst).trim()) return null; // optional
  const normalized = String(gst).trim().toUpperCase();
  if (!GSTIN_REGEX.test(normalized)) {
    return 'GST number must be a valid 15-character GSTIN (e.g. 29ABCDE1234F1Z5)';
  }
  return null;
}

export function validateWebsite(url) {
  if (!url || !String(url).trim()) return null; // optional
  if (!URL_REGEX.test(String(url).trim())) {
    return 'Website must be a valid URL starting with http:// or https://';
  }
  return null;
}

export function validateLogoUrl(url) {
  if (!url || !String(url).trim()) return null;
  if (!URL_REGEX.test(String(url).trim())) {
    return 'Logo URL must be a valid http(s) URL';
  }
  return null;
}

export function validateFoundedYear(year) {
  if (!year && year !== 0) return null;
  const y = Number(year);
  const current = new Date().getFullYear();
  if (!Number.isInteger(y) || y < 1800 || y > current) {
    return `Founded year must be between 1800 and ${current}`;
  }
  return null;
}

export function validateEmployerType(type) {
  if (!type || !String(type).trim()) return null;
  if (!EMPLOYER_TYPES.includes(type)) {
    return `Employer type must be one of: ${EMPLOYER_TYPES.join(', ')}`;
  }
  return null;
}

export function validateHiringStatus(status) {
  if (!status || !String(status).trim()) return null;
  if (!HIRING_STATUSES.includes(status)) {
    return `Hiring status must be one of: ${HIRING_STATUSES.join(', ')}`;
  }
  return null;
}

export function validateEmployeeCount(count) {
  if (!count || !String(count).trim()) return null;
  if (!EMPLOYEE_COUNTS.includes(count)) {
    return 'Please select a valid company size';
  }
  return null;
}

export function validateCompanyPayload(body) {
  const errors = [];
  const { name, website, logoUrl, employeeCount, extraDetails = {} } = body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Company name is required (min 2 characters)');
  }

  const checks = [
    validateWebsite(website),
    validateLogoUrl(logoUrl),
    validateEmployeeCount(employeeCount),
    validateFoundedYear(extraDetails.foundedYear),
    validateEmployerType(extraDetails.employerType),
    validateHiringStatus(extraDetails.hiringStatus),
    validateGstNumber(extraDetails.gstNumber),
  ];

  checks.filter(Boolean).forEach((msg) => errors.push(msg));
  return errors;
}
