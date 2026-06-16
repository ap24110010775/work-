import { savedJobService } from '../services/savedJobService.js';

// Helper: formats salary range
const formatSalary = (min, max, currency = 'INR') => {
  if (!min && !max) return 'Salary not disclosed';
  const fmt = (n) => Number(n).toLocaleString('en-IN');
  if (min && max) return `${currency} ${fmt(min)} – ${fmt(max)}`;
  if (min) return `${currency} ${fmt(min)}+`;
  return `Up to ${currency} ${fmt(max)}`;
};

export const savedJobHandler = {
  // POST /api/v1/saved-jobs
  async save(req, res) {
    try {
      const candidateId = req.user.id;
      const jobId = Number(req.body.jobId);

      if (!jobId || isNaN(jobId)) {
        return res.status(400).json({
          success: false,
          error: 'ValidationError',
          message: 'jobId is required and must be a valid number'
        });
      }

      const result = await savedJobService.saveJob(jobId, candidateId);
      return res.status(201).json({
        success: true,
        message: 'Job saved successfully',
        ...result
      });
    } catch (error) {
      console.error('Error saving job:', error);
      if (error.message.includes('does not exist')) {
        return res.status(404).json({ success: false, error: 'NotFound', message: error.message });
      }
      return res.status(500).json({ success: false, error: 'ServerError', message: 'Unable to save job' });
    }
  },

  // GET /api/v1/saved-jobs
  async list(req, res) {
    try {
      const candidateId = req.user.id;
      const rows = await savedJobService.getSavedJobs(candidateId);

      const savedJobs = rows.map((row) => ({
        savedId: row.savedId,
        savedAt: row.savedAt,
        job: {
          id: row.jobId,
          title: row.jobTitle,
          jobType: row.jobType,
          locationType: row.locationType,
          location: row.jobLocation || 'Remote',
          salaryRange: formatSalary(row.salaryMin, row.salaryMax, row.currency),
          status: row.jobStatus,
          company: {
            name: row.companyName || 'Independent Employer',
            logo: row.companyLogo || '/assets/default-company.png'
          }
        }
      }));

      return res.json({
        success: true,
        count: savedJobs.length,
        savedJobs
      });
    } catch (error) {
      console.error('Error listing saved jobs:', error);
      return res.status(500).json({ success: false, error: 'ServerError', message: 'Unable to retrieve saved jobs' });
    }
  },

  // GET /api/v1/saved-jobs/ids  (lightweight — just the list of job IDs)
  async listIds(req, res) {
    try {
      const candidateId = req.user.id;
      const ids = await savedJobService.getSavedJobIds(candidateId);
      return res.json({ success: true, savedJobIds: ids });
    } catch (error) {
      console.error('Error listing saved job IDs:', error);
      return res.status(500).json({ success: false, error: 'ServerError', message: 'Unable to retrieve saved job IDs' });
    }
  },

  // DELETE /api/v1/saved-jobs/:jobId
  async remove(req, res) {
    try {
      const candidateId = req.user.id;
      const jobId = Number(req.params.jobId);

      if (isNaN(jobId)) {
        return res.status(400).json({
          success: false,
          error: 'BadRequest',
          message: 'jobId must be a valid number'
        });
      }

      const result = await savedJobService.unsaveJob(jobId, candidateId);
      return res.json({
        success: true,
        message: 'Job removed from saved list',
        ...result
      });
    } catch (error) {
      console.error('Error removing saved job:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, error: 'NotFound', message: error.message });
      }
      return res.status(500).json({ success: false, error: 'ServerError', message: 'Unable to remove saved job' });
    }
  }
};
