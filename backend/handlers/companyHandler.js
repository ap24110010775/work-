import { companyService } from '../services/companyService.js';
import { companyTransformer } from '../transformations/companyTransformer.js';
import { authDao } from '../database/authDao.js';

export const companyHandler = {
  // GET /api/v1/company
  async getCompany(req, res) {
    try {
      const employerId = req.user.id;
      const user = await authDao.findById(employerId);

      const company = await companyService.getCompanyProfile(employerId, user?.name);
      
      return res.json({
        success: true,
        company: companyTransformer.toResponse(company)
      });
    } catch (error) {
      console.error('Error fetching company profile:', error);
      return res.status(500).json({ success: false, error: 'ServerError', message: 'Unable to fetch company profile' });
    }
  },

  // PUT /api/v1/company
  async updateCompany(req, res) {
    try {
      const employerId = req.user.id;
      const {
        name,
        description,
        logoUrl,
        website,
        industry,
        location,
        employeeCount,
        extraDetails
      } = req.body;

      const payload = {
        name,
        description,
        logo_url: logoUrl,
        website,
        industry,
        location,
        employee_count: employeeCount,
        extra_details: extraDetails || {}
      };

      const updatedCompany = await companyService.updateCompanyProfile(employerId, payload);
      
      return res.json({
        success: true,
        message: 'Company profile updated successfully',
        company: companyTransformer.toResponse(updatedCompany)
      });
    } catch (error) {
      console.error('Error updating company profile:', error);
      return res.status(500).json({ success: false, error: 'ServerError', message: 'Unable to update company profile' });
    }
  }
};
