// middleware/errorHandler.js

import apiResponse from '../utils/apiResponse.js';

function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  return apiResponse.error(res, message, statusCode);
}

export default errorHandler;
