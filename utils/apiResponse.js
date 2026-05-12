// utils/apiResponse.js

function success(res, data = null, message = 'Success', meta = null, statusCode = 200) {
  const response = { success: true, message, data };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
}

function error(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
}

export default { success, error };
