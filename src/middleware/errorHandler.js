export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Handle specific error types
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(400).json({
      error: 'Constraint violation',
      details: err.message
    });
  }

  if (err.code === 'SQLITE_ERROR') {
    return res.status(500).json({
      error: 'Database error',
      details: err.message
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
}

export function notFound(req, res) {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
}