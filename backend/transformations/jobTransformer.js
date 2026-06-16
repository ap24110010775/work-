export const jobTransformer = {
  // Map database job row to client-side API response DTO
  toResponse(job) {
    if (!job) return null;

    // Parse requirements string into array if it exists as comma-separated or similar
    let requirementsArray = [];
    if (job.requirements) {
      requirementsArray = job.requirements
        .split(',')
        .map(req => req.trim())
        .filter(Boolean);
    }

    return {
      id: job.id,
      title: job.title,
      description: job.description,
      requirements: requirementsArray,
      locationType: job.locationType,
      jobType: job.jobType,
      location: job.location || 'Remote',
      salaryRange: job.salaryMin && job.salaryMax 
        ? `${formatCurrency(job.salaryMin)} - ${formatCurrency(job.salaryMax)}`
        : 'Salary undisclosed',
      rawSalaryMin: job.salaryMin,
      rawSalaryMax: job.salaryMax,
      currency: job.currency,
      status: job.status,
      createdAt: job.createdAt,
      company: {
        name: job.companyName || 'Independent Employer',
        logo: job.companyLogo || '/assets/default-company.png'
      }
    };
  },

  toResponseList(jobs) {
    if (!Array.isArray(jobs)) return [];
    return jobs.map(job => this.toResponse(job));
  }
};

function formatCurrency(value) {
  const num = Number(value);
  if (isNaN(num)) return value;
  // Convert to Indian Lakhs format (common in the region for this app) or keep short notation
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(1)} LPA`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
}
