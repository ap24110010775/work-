export const companyTransformer = {
  toResponse(company) {
    if (!company) return null;
    return {
      id: company.id,
      name: company.name,
      description: company.description || '',
      logoUrl: company.logo_url || '',
      website: company.website || '',
      industry: company.industry || '',
      location: company.location || '',
      employeeCount: company.employee_count || '',
      extraDetails: company.extraDetails || {}
    };
  }
};
