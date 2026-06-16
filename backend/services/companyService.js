import { companyDao } from '../database/companyDao.js';

export const companyService = {
  async getCompanyProfile(employerId, userName) {
    const company = await companyDao.ensureCompanyExists(employerId, userName);
    
    // Parse JSON
    let extraDetails = {};
    if (company.extra_details) {
      try {
        extraDetails = typeof company.extra_details === 'string' 
          ? JSON.parse(company.extra_details) 
          : company.extra_details;
      } catch (e) {
        console.error('Error parsing company extra_details:', e);
      }
    }
    
    return { ...company, extraDetails };
  },

  async updateCompanyProfile(employerId, payload) {
    await companyDao.updateCompany(employerId, payload);
    return await this.getCompanyProfile(employerId, null);
  }
};
