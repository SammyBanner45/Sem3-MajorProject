const { HttpError } = require('../lib/httpError');

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'Request body must contain valid JSON.' },
    });
  }

  if (error instanceof HttpError) {
    const response = {
      error: { code: error.code, message: error.message },
    };
    if (error.details) response.error.details = error.details;
    return res.status(error.status).json(response);
  }

  if (error.code === 'P2002') {
    return res.status(409).json({
      error: { code: 'RESOURCE_CONFLICT', message: 'The request conflicts with an existing record.' },
    });
  }

  console.error('Unhandled request error:', {
    name: error?.name || 'Error',
    code: error?.code,
  });
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
  });
}

module.exports = { errorHandler };
