import { query, singleQuery, pagedQuery } from '../db.js';
import { addPageMetadata } from '../utils/addPageMetadata.js';
import { logger } from '../utils/logger.js';

async function seasonEpisodes(serieId, seasonId) {
  let episodes = [];
  try {
    const result = await query(
      `SELECT
        name, "number", air_date, overview
      FROM
        episodes
      WHERE
        serieId = $1 AND seasonId = $2`,
      [serieId, seasonId],
    );

    if (result.rows && result.rows.length > 0) {
      episodes = result.rows;
    }
  } catch (e) {
    logger.warn('Unable to query episodes for season', serieId, seasonId, e);
  }

  return episodes;
}

export async function listSeasons(req, res) {
  const { offset = 0, limit = 10 } = req.query;
  const { id } = req.params;

  const categories = await pagedQuery(
    `SELECT
        id, name, "number", air_date, overview, poster
      FROM
        seasons
      WHERE
        serieId = $1
      ORDER BY "number" ASC`,
    [id],
    { offset, limit },
  );

  const categoriesWithPage = addPageMetadata(
    categories,
    req.path,
    { offset, limit, length: categories.items.length },
  );

  return res.json(categoriesWithPage);
}

export async function listSeason(serieId, { params = {} } = {}) {
  const { season: seasonNumber } = params;

  if (!seasonNumber) {
    return null;
  }

  const season = await singleQuery(
    `
      SELECT
        id, name, "number", air_date, overview, poster
      FROM
        seasons
      WHERE
        serieId = $1 AND
        "number" = $2
    `,
    [serieId, seasonNumber],
  );

  if (!season) {
    return null;
  }

  const episodes = await seasonEpisodes(serieId, season.id);

  season.episodes = episodes;

  return season;
}

export async function createSeason() {
  return null;
}

export async function deleteSeason() {
  return null;
}
