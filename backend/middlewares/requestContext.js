import { v4 as uuidv4 } from 'uuid';

export const requestContext = (req, res, next) => {
  // Generate a unique ID for every request for traceability
  req.requestId = uuidv4();
  
  // Set the header so the client can also track the request ID if needed
  res.setHeader('X-Request-Id', req.requestId);
  
  next();
};
