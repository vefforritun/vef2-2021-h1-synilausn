import xss from 'xss';

import { pagedQuery, singleQuery } from '../db.js';
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

export async function createGenre(req, res) {
  const { name } = req.body;

  try {
    // TODO refactor, use db.js insertGenre
    const newGenre = await singleQuery(
      `
        INSERT INTO
          genres (name)
        VALUES
          ($1)
        RETURNING
          id, name
      `,
      [xss(name)],
    );
    return res.status(201).json(newGenre);
  } catch (e) {
    logger.error(`unable to create genre "${name}"`, e);
  }

  return res.status(500).json(null);
}
