import { validationResult } from 'express-validator';

import { logger } from '../utils/logger.js';

export function validationCheck(req, res, next) {
  const validation = validationResult(req);

  if (!validation.isEmpty()) {
    const notFoundError = validation.errors.find((error) => error.msg === 'not found');
    const serverError = validation.errors.find((error) => error.msg === 'server error');

    // We loose the actual error object of LoginError, match with error message
    // TODO brittle, better way?
    const loginError = validation.errors.find((error) => error.msg === 'username or password incorrect');

    let status = 400;

    if (serverError) {
      status = 500;
    } else if (notFoundError) {
      status = 404;
    } else if (loginError) {
      status = 401;
    }

    // Strecthing the express-validator library...
    // @see auth/api.js
    const validationErrorsWithoutSkip = validation.errors.filter((error) => error.msg !== 'skip');

    return res.status(status).json({ errors: validationErrorsWithoutSkip });
  }

  return next();
}

export function resourceExists(fn) {
  return (value, { req }) => fn(value, req)
    .then((resource) => {
      if (!resource) {
        return Promise.reject(new Error('not found'));
      }
      req.resource = resource;
      return Promise.resolve();
    })
    .catch((error) => {
      if (error.message === 'not found') {
        // This we just handled
        return Promise.reject(error);
      }

      // This is something we did *not* handle, treat as 500 error
      logger.warn('Error from middleware:', error);
      return Promise.reject(new Error('server error'));
    });
}
