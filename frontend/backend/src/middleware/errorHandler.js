export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Google API errors
  if (err.code && err.errors) {
    return res.status(err.code).json({
      error: 'Google API Error',
      message: err.message,
      details: err.errors
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};