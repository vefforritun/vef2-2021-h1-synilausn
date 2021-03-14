import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import express from 'express';
import multer from 'multer';

import { requireAuthentication, requireAdmin } from '../auth/passport.js';
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
} from './rating.js';

import {
  createState,
  updateState,
  deleteState,
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
  validateResource,
  atLeastOneBodyValueValidator,
} from '../validation/validators.js';
import { validationCheck } from '../validation/helpers.js';

const MULTER_TEMP_DIR = './temp';

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

const path = dirname(fileURLToPath(import.meta.url));

export const router = express.Router();

function notImplemented(req, res) {
  return res.status(501).json({ error: 'not implemented (yet)' });
}

function returnResource(req, res) {
  return res.json(req.resource);
}

router.get('/', async (req, res) => {
  const indexJson = await readFile(join(path, './index.json'));
  res.json(JSON.parse(indexJson));
});

router.get(
  '/tv',
  pagingQuerystringValidator,
  validationCheck,
  catchErrors(listSeries),
);

router.get(
  '/tv/:serieId',
  validateResource(listSerie),
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
  validateResource(listSeason),
  validationCheck,
  returnResource,
);

router.get(
  '/tv/:serieId/season/:seasonId/episode/:episodeId',
  serieIdValidator,
  seasonIdValidator,
  episodeIdValidator,
  validateResource(listEpisode),
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
  validateResource(listUser),
  validationCheck,
  returnResource,
);

router.patch(
  '/users/:id',
  requireAdmin,
  validateResource(listUser),
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
  validateResource(listEpisode),
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
  validateResource(listSeason),
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
  validateResource(listSerie),
  validationCheck,
  catchErrors(deleteSerie),
);

router.patch(
  '/tv/:serieId',
  requireAdmin,
  serieIdValidator.bail(),
  serieValidators,
  atLeastOneBodyValueValidator(['name', 'airDate', 'inProduction', 'tagline', 'image', 'description', 'language', 'network', 'url']),
  validationCheck,
  catchErrors(updateSerie),
);

/* */

router.patch('/tv/:id', notImplemented); // , requireAdmin, updateSerie);

/* user auth routes */

router.post('/tv/:id/rate', requireAuthentication, createRating);
router.patch('/tv/:id/rate', requireAuthentication, updateRating);
router.delete('/tv/:id/rate', requireAuthentication, deleteRating);
router.post('/tv/:id/state', requireAuthentication, createState);
router.patch('/tv/:id/state', requireAuthentication, updateState);
router.delete('/tv/:id/state', requireAuthentication, deleteState);
