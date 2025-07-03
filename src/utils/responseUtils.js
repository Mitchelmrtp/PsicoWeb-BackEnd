/**
 * Response Utilities
 * Aplica DRY principle y estandariza las respuestas de la API
 */

export class ApiResponse {
  constructor(success, data = null, message = null, error = null) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.error = error;
    this.timestamp = new Date().toISOString();
  }

  static success(data, message = 'Operation successful') {
    return new ApiResponse(true, data, message);
  }

  static error(error, message = 'Operation failed') {
    return new ApiResponse(false, null, message, error);
  }

  static created(data, message = 'Resource created successfully') {
    return new ApiResponse(true, data, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiResponse(false, null, message, 'NOT_FOUND');
  }

  static unauthorized(message = 'Unauthorized access') {
    return new ApiResponse(false, null, message, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Access forbidden') {
    return new ApiResponse(false, null, message, 'FORBIDDEN');
  }

  static badRequest(message = 'Bad request') {
    return new ApiResponse(false, null, message, 'BAD_REQUEST');
  }

  static validationError(errors, message = 'Validation failed') {
    return new ApiResponse(false, null, message, errors);
  }
}

export const sendResponse = (res, statusCode, response) => {
  return res.status(statusCode).json(response);
};

export const sendSuccess = (res, data, message = 'Operation successful') => {
  return sendResponse(res, 200, ApiResponse.success(data, message));
};

export const sendCreated = (res, data, message = 'Resource created successfully') => {
  return sendResponse(res, 201, ApiResponse.created(data, message));
};

export const sendError = (res, statusCode, error, message = 'Operation failed') => {
  return sendResponse(res, statusCode, ApiResponse.error(error, message));
};

export const sendNotFound = (res, message = 'Resource not found') => {
  return sendResponse(res, 404, ApiResponse.notFound(message));
};

export const sendUnauthorized = (res, message = 'Unauthorized access') => {
  return sendResponse(res, 401, ApiResponse.unauthorized(message));
};

export const sendForbidden = (res, message = 'Access forbidden') => {
  return sendResponse(res, 403, ApiResponse.forbidden(message));
};

export const sendBadRequest = (res, message = 'Bad request') => {
  return sendResponse(res, 400, ApiResponse.badRequest(message));
};

export const sendValidationError = (res, errors, message = 'Validation failed') => {
  return sendResponse(res, 400, ApiResponse.validationError(errors, message));
};

export const sendServerError = (res, error, message = 'Internal server error') => {
  console.error('Server Error:', error);
  return sendResponse(res, 500, ApiResponse.error(
    process.env.NODE_ENV === 'development' ? error : 'Internal server error',
    message
  ));
};

/**
 * Handles service responses uniformly in controllers
 * @param {Object} res - Express response object
 * @param {Object} serviceResult - Result from service layer
 */
export const handleServiceResponse = (res, serviceResult) => {
    if (serviceResult.success) {
        return res.status(serviceResult.statusCode || 200).json(serviceResult);
    } else {
        return res.status(serviceResult.statusCode || 500).json(serviceResult);
    }
};

/**
 * Creates a standardized success response for services
 * @param {*} data - The data to return
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} message - Success message
 * @returns {Object} Standardized success response
 */
export const createSuccessResponse = (data, statusCode = 200, message = 'Operation successful') => {
  return {
    success: true,
    statusCode,
    data,
    message,
    timestamp: new Date().toISOString()
  };
};

/**
 * Creates a standardized error response for services
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {*} error - Error details
 * @returns {Object} Standardized error response
 */
export const createErrorResponse = (message, statusCode = 500, error = null) => {
  return {
    success: false,
    statusCode,
    message,
    error,
    timestamp: new Date().toISOString()
  };
};
