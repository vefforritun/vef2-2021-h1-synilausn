import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import express from 'express';

import { requireAuthentication, requireAdmin } from '../auth/passport.js';
import { catchErrors } from '../utils/catchErrors.js';
import { readFile } from '../utils/fs-helpers.js';

import {
  listSeries,
  listSerie,
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
  adminValidator, pagingQuerystringValidator, validateResource, validationCheck,
} from '../validation/validators.js';

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
  '/tv/:id',
  validateResource(listSerie),
  validationCheck,
  returnResource,
);
router.get(
  '/tv/:id/season',
  pagingQuerystringValidator,
  validationCheck,
  catchErrors(listSeasons),
);
router.get(
  '/tv/:id/season/:season',
  validateResource(listSeason),
  validationCheck,
  returnResource,
);
router.get(
  '/tv/:id/season/:season/episode/:episode',
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

/* user auth routes */

router.post('/tv/:id/rate', requireAuthentication, createRating);
router.patch('/tv/:id/rate', requireAuthentication, updateRating);
router.delete('/tv/:id/rate', requireAuthentication, deleteRating);
router.post('/tv/:id/state', requireAuthentication, createState);
router.patch('/tv/:id/state', requireAuthentication, updateState);
router.delete('/tv/:id/state', requireAuthentication, deleteState);

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
  updateUser,
);

router.post(
  '/tv',
  notImplemented,
); // , requireAdmin, createSerie);

router.patch('/tv/:id', notImplemented); // , requireAdmin, updateSerie);
router.delete('/tv/:id', notImplemented); // , requireAdmin, deleteSerie);

router.post('/tv/:id/season', requireAdmin, createSeason);

router.delete('/tv/:id/season/:season', deleteSeason);

router.post('/tv/:id/season/:season/episode', requireAdmin, createEpisode);

router.delete('/tv/:id/season/:season/episode/:episode', requireAdmin, deleteEpisode);

router.post('/genres', requireAdmin, createGenre);
