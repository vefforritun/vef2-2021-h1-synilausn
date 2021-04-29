import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import express from 'express';
import multer from 'multer';

import { requireAuthentication, requireAdmin, addUserIfAuthenticated } from '../auth/passport.js';
import { catchErrors } from '../utils/catchErrors.js';
import { readFile } from '../utils/fs-helpers.js';

import {
  listSeries,
  listSerie,
  createSerie,
  deleteSerie,
  updateSerie,
} from './series.js';

import {
  listSeasons,
  createSeason,
  listSeason,
  deleteSeason,
} from './seasons.js';

import {
  createEpisode,
  listEpisode,
  deleteEpisode,
} from './episodes.js';

import {
  listGenres,
  createGenre,
} from './genres.js';

import {
  createRating,
  updateRating,
  deleteRating,
  listRating,
} from './rating.js';

import {
  createState,
  updateState,
  deleteState,
  listState,
} from './state.js';

import {
  listUsers,
  listUser,
  updateUser,
} from './users.js';

import {
  adminValidator,
  episodeIdValidator,
  episodeValidators,
  nameValidator,
  pagingQuerystringValidator,
  seasonIdValidator,
  serieIdValidator,
  seasonValidators,
  serieValidators,
  validateResourceExists,
  validateResourceNotExists,
  atLeastOneBodyValueValidator,
  validateRating,
  validateState,
} from '../validation/validators.js';
import { validationCheck } from '../validation/helpers.js';

/**
 * Langt skjal! En hér erum við að útbúa hverja og einasta route (fyrir utan
 * auth) í API. Notar declerative validation sem er öll skilgreind í
 * `/src/validation`.
 */

// TODO færa í .env
const MULTER_TEMP_DIR = './temp';

/**
 * Hjálparfall til að bæta multer við route.
 */
function withMulter(req, res, next) {
  multer({ dest: MULTER_TEMP_DIR })
    .single('image')(req, res, (err) => {
      if (err) {
        if (err.message === 'Unexpected field') {
          const errors = [{
            field: 'image',
            error: 'Unable to read image',
          }];
          return res.status(400).json({ errors });
        }

        return next(err);
      }

      return next();
    });
}

export const router = express.Router();

function returnResource(req, res) {
  return res.json(req.resource);
}

// Sækjum yfirlit yfir API úr index.json og sendum beint út
router.get('/', async (req, res) => {
  const path = dirname(fileURLToPath(import.meta.url));
  const indexJson = await readFile(join(path, './index.json'));
  res.json(JSON.parse(indexJson));
});

/**
 * Hér fylga allar skilgreiningar á routes, þær fylgja eftirfarandi mynstri:
 *
 * router.HTTP_METHOD(
 *  ROUTE_WITH_PARAM,
 *  VALIDATOR_MIDDLEWARE_1,
 *  ...
 *  VALIDATOR_MIDDLEWARE_N,
 *  validationCheck, // Sendir validation villur, ef einhverjar
 *  RESULT, // Eitthvað sem sendir svar til client ef allt OK
 * );
 */

router.get(
  '/tv',
  pagingQuerystringValidator,
  validationCheck,
  catchErrors(listSeries),
);

router.get(
  '/tv/:serieId',
  addUserIfAuthenticated,
  validateResourceExists(listSerie),
  validationCheck,
  returnResource,
);

router.get(
  '/tv/:serieId/season',
  pagingQuerystringValidator,
  validationCheck,
  catchErrors(listSeasons),
);

router.get(
  '/tv/:serieId/season/:seasonId',
  validateResourceExists(listSeason),
  validationCheck,
  returnResource,
);

router.get(
  '/tv/:serieId/season/:seasonId/episode/:episodeId',
  serieIdValidator,
  seasonIdValidator,
  episodeIdValidator,
  validateResourceExists(listEpisode),
  validationCheck,
  returnResource,
);

router.get(
  '/genres',
  pagingQuerystringValidator,
  validationCheck,
  catchErrors(listGenres),
);

/* admin auth routes */

router.get(
  '/users',
  requireAdmin,
  pagingQuerystringValidator,
  validationCheck,
  listUsers,
);

router.get(
  '/users/:id',
  requireAdmin,
  validateResourceExists(listUser),
  validationCheck,
  returnResource,
);

router.patch(
  '/users/:id',
  requireAdmin,
  validateResourceExists(listUser),
  adminValidator,
  validationCheck,
  catchErrors(updateUser),
);

router.post(
  '/genres',
  requireAdmin,
  nameValidator,
  validationCheck,
  catchErrors(createGenre),
);

router.post(
  '/tv/:serieId/season/:seasonId/episode',
  requireAdmin,
  episodeValidators,
  validationCheck,
  catchErrors(createEpisode),
);

router.delete(
  '/tv/:serieId/season/:seasonId/episode/:episodeId',
  requireAdmin,
  episodeIdValidator,
  serieIdValidator,
  seasonIdValidator.bail(),
  validateResourceExists(listEpisode),
  validationCheck,
  catchErrors(deleteEpisode),
);

router.post(
  '/tv/:serieId/season/',
  requireAdmin,
  withMulter,
  seasonValidators,
  validationCheck,
  catchErrors(createSeason),
);

router.delete(
  '/tv/:serieId/season/:seasonId',
  requireAdmin,
  serieIdValidator,
  seasonIdValidator.bail(),
  validateResourceExists(listSeason),
  validationCheck,
  catchErrors(deleteSeason),
);

router.post(
  '/tv/',
  requireAdmin,
  withMulter,
  serieValidators,
  validationCheck,
  catchErrors(createSerie),
);

router.delete(
  '/tv/:serieId',
  requireAdmin,
  serieIdValidator.bail(),
  validateResourceExists(listSerie),
  validationCheck,
  catchErrors(deleteSerie),
);

router.patch(
  '/tv/:serieId',
  requireAdmin,
  withMulter,
  serieIdValidator.bail(),
  serieValidators,
  atLeastOneBodyValueValidator(['name', 'airDate', 'inProduction', 'tagline', 'image', 'description', 'language', 'network', 'url']),
  validationCheck,
  catchErrors(updateSerie),
);

/* user auth routes */

router.post(
  '/tv/:serieId/rate',
  requireAuthentication,
  serieIdValidator.bail(),
  validateResourceExists(listSerie),
  validateResourceNotExists(listRating),
  validateRating,
  validationCheck,
  catchErrors(createRating),
);

router.patch(
  '/tv/:serieId/rate',
  requireAuthentication,
  serieIdValidator.bail(),
  validateResourceExists(listSerie),
  validateResourceExists(listRating),
  validateRating,
  validationCheck,
  catchErrors(updateRating),
);

router.delete(
  '/tv/:serieId/rate',
  requireAuthentication,
  serieIdValidator.bail(),
  validateResourceExists(listSerie),
  validateResourceExists(listRating),
  validationCheck,
  catchErrors(deleteRating),
);

router.post(
  '/tv/:serieId/state',
  requireAuthentication,
  serieIdValidator.bail(),
  validateResourceExists(listSerie),
  validateResourceNotExists(listState),
  validateState,
  validationCheck,
  catchErrors(createState),
);

router.patch(
  '/tv/:serieId/state',
  requireAuthentication,
  serieIdValidator.bail(),
  validateResourceExists(listSerie),
  validateResourceExists(listState),
  validateState,
  validationCheck,
  catchErrors(updateState),
);

router.delete(
  '/tv/:serieId/state',
  requireAuthentication,
  serieIdValidator.bail(),
  validateResourceExists(listSerie),
  validateResourceExists(listState),
  validationCheck,
  catchErrors(deleteState),
);
