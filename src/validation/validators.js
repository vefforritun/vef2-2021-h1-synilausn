import {
  body, query, param, validationResult,
} from 'express-validator';

import { comparePasswords, findByEmail, findByUsername } from '../auth/users.js';

import { LoginError } from '../errors.js';
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

export const pagingQuerystringValidator = [
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

export const usernameValidator = body('username')
  .isLength({ min: 1, max: 256 })
  .withMessage('username is required, max 256 characters');

export const emailValidator = body('email')
  .if((value, { req }) => {
    if (!value && req.method === 'PATCH') {
      return false;
    }

    return true;
  })
  .isLength({ min: 1, max: 256 })
  .isEmail()
  .withMessage('email is required, max 256 characters');

export const passwordValidator = body('password')
  .if((value, { req }) => {
    if (!value && req.method === 'PATCH') {
      return false;
    }

    return true;
  })
  .isLength({ min: 10, max: 256 })
  .withMessage('password is required, min 10 characters, max 256 characters');

export const emailDoesNotExistValidator = body('email')
  .custom(async (email) => {
    const user = await findByEmail(email);

    if (user) {
      return Promise.reject(new Error('email already exists'));
    }
    return Promise.resolve();
  });

export const usernameDoesNotExistValidator = body('username')
  .custom(async (username) => {
    const user = await findByUsername(username);

    if (user) {
      return Promise.reject(new Error('username already exists'));
    }
    return Promise.resolve();
  });

export const usernameAndPaswordValidValidator = body('username')
  .custom(async (username, { req: { body: reqBody } = {} }) => {
    // Can't bail after username and password validators, so some duplication
    // of validation here
    // TODO use schema validation instead?
    const { password } = reqBody;

    if (!username || !password) {
      return Promise.reject(new Error('skip'));
    }

    let valid = false;
    try {
      const user = await findByUsername(username);
      valid = await comparePasswords(password, user.password);
    } catch (e) {
      // Here we would track login attempts for monitoring purposes
      logger.info(`invalid login attempt for ${username}`);
    }

    if (!valid) {
      return Promise.reject(new LoginError('username or password incorrect'));
    }
    return Promise.resolve();
  });

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

export function atLeastOneBodyValueValidator(fields) {
  return body()
    .custom(async (value, { req }) => {
      const { body: reqBody } = req;

      let valid = false;

      for (let i = 0; i < fields.length; i += 1) {
        const field = fields[i];

        if (field in reqBody && reqBody[field] != null) {
          valid = true;
          break;
        }
      }

      if (!valid) {
        return Promise.reject(new Error(`require at least one value of: ${fields.join(', ')}`));
      }
      return Promise.resolve();
    });
}
