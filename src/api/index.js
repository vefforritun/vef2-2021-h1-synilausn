import express from 'express';

import { requireAuthentication, requireAdmin } from '../auth/passport.js';
import { catchErrors } from '../utils/catchErrors.js';
import {
  notImplemented, returnResource, validatePagingQuerystring, validateResource, validationCheck,
} from './utils.js';

import {
  listSeries,
  listSerie,
/*   createSerie,
  updateSerie,
  deleteSerie, */
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
  currentUser,
  updateCurrentUser,
} from './users.js';

export const router = express.Router();

router.get('/', (req, res) => res.json({
  tv: {
    series: {
      href: '/tv',
      methods: ['GET', 'POST'],
    },
    serie: {
      href: '/tv/{id}',
      methods: ['GET', 'PATCH', 'DELETE'],
    },
    rate: {
      href: '/tv/{id}/rate',
      methods: ['POST', 'PATCH', 'DELETE'],
    },
    state: {
      href: '/tv/{id}/state',
      methods: ['POST', 'PATCH', 'DELETE'],
    },
  },
  seasons: {
    seasons: {
      href: '/tv/{id}/season',
      methods: ['GET', 'POST'],
    },
    season: {
      href: '/tv/{id}/season/{season}',
      methods: ['GET', 'DELETE'],
    },
  },
  episodes: {
    episodes: {
      href: '/tv/{id}/season/{season}/episode',
      methods: ['POST'],
    },
    episode: {
      href: '/tv/{id}/season/{season}/episode/{episode}',
      methods: ['GET', 'DELETE'],
    },
  },
  genres: {
    genres: {
      href: '/genres',
      methods: ['GET', 'POST'],
    },
  },
  users: {
    users: {
      href: '/users',
      methods: ['GET'],
    },
    user: {
      href: '/users/{id}',
      methods: ['GET', 'PATCH'],
    },
    register: {
      href: '/users/register',
      methods: ['POST'],
    },
    login: {
      href: '/users/login',
      methods: ['POST'],
    },
    me: {
      href: '/users/me',
      methods: ['GET', 'PATCH'],
    },
  },
}));

router.get(
  '/tv',
  validatePagingQuerystring,
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
  validatePagingQuerystring,
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
  validatePagingQuerystring,
  validationCheck,
  catchErrors(listGenres),
);

router.post(
  '/tv',
  notImplemented,
); // , requireAdmin, createSerie);
router.patch('/tv/:id', notImplemented); // , requireAdmin, updateSerie);
router.delete('/tv/:id', notImplemented); // , requireAdmin, deleteSerie);

router.post('/tv/:id/rate', requireAuthentication, createRating);
router.patch('/tv/:id/rate', requireAuthentication, updateRating);
router.delete('/tv/:id/rate', requireAuthentication, deleteRating);
router.post('/tv/:id/state', requireAuthentication, createState);
router.patch('/tv/:id/state', requireAuthentication, updateState);
router.delete('/tv/:id/state', requireAuthentication, deleteState);

router.post('/tv/:id/season', requireAdmin, createSeason);

router.delete('/tv/:id/season/:season', deleteSeason);

router.post('/tv/:id/season/:season/episode', requireAdmin, createEpisode);

router.delete('/tv/:id/season/:season/episode/:episode', requireAdmin, deleteEpisode);

router.post('/genres', requireAdmin, createGenre);

router.get('/users', requireAdmin, listUsers);
router.get('/users/me', requireAuthentication, currentUser);
router.patch('/users/me', requireAuthentication, updateCurrentUser);
router.get('/users/:id', requireAdmin, listUser);
router.patch('/users/:id', requireAdmin, updateUser);
