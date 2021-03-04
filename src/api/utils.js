import { query, param, validationResult } from 'express-validator';
import { logger } from '../utils/logger.js';

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

export function returnResource(req, res) {
  return res.json(req.resource);
}

export function validationCheck(req, res, next) {
  const validation = validationResult(req);

  if (!validation.isEmpty()) {
    const notFoundError = validation.errors.find((error) => error.msg === 'not found');
    const serverError = validation.errors.find((error) => error.msg === 'server error');

    // eslint-disable-next-line no-nested-ternary
    const status = serverError ? 500 : (notFoundError ? 404 : 400);

    return res.status(status).json({ errors: validation.errors });
  }

  return next();
}

export const validatePagingQuerystring = [
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('query parameter "offset" must be an int, 0 or larget'),
  query('limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('query parameter "limit" must be an int, larger than 0'),
];

export function validateResource(fetchResource) {
  return [
    param('id')
      .isInt({ min: 0 })
      .withMessage('param "id" must be a positive integer, larger than 0'),
    param('id')
      .custom(resourceExists(fetchResource))
      .withMessage('not found'),
  ];
}

export function notImplemented(req, res) {
  return res.status(501).json({ error: 'not implemented (yet)' });
}
