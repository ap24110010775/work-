import { validateCompanyPayload } from './fieldValidators.js';

export const companyValidation = {
  validateUpdate(req, res, next) {
    const errors = validateCompanyPayload(req.body);

    if (req.body.extraDetails && typeof req.body.extraDetails !== 'object') {
      errors.push('extraDetails must be a valid JSON object');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: errors[0],
        details: errors,
      });
    }

    next();
  },
};
