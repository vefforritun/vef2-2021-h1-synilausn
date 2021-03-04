import { query, singleQuery, pagedQuery } from '../db.js';
import { addPageMetadata } from '../utils/addPageMetadata.js';
import { logger } from '../utils/logger.js';

export async function listGenres(req, res) {
  const { offset = 0, limit = 10 } = req.query;

  const genres = await pagedQuery(
    `SELECT
        name
      FROM
        genres
      ORDER BY id ASC`,
    [],
    { offset, limit },
  );

  const genresWithPage = addPageMetadata(
    genres,
    req.path,
    { offset, limit, length: genres.items.length },
  );

  return res.json(genresWithPage);
}

export const createGenre = [
];
