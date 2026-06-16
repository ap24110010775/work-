export const errorMiddleware = (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.url}`, err.stack);

  // If response was already sent, delegate to default express handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle specific known error types if needed (e.g., validation errors)
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: err.message
    });
  }

  // Default to 500 server error
  return res.status(500).json({
    success: false,
    error: 'ServerError',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
};
