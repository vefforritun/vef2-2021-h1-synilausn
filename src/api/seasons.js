import {
  query, singleQuery, pagedQuery, insertSeason, deleteQuery,
} from '../db.js';
import { addPageMetadata } from '../utils/addPageMetadata.js';
import { uploadImage } from '../utils/cloudinary.js';
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
  const { serieId: id } = req.params;

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

export async function listSeason(_, { params = {} } = {}) {
  // TODO number/id mismatch
  const { serieId, seasonId: seasonNumber } = params;

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

export async function createSeason(req, res) {
  const { serieId } = req.params;
  const {
    name, number, overview = null, airDate = null,
  } = req.body;
  const { path: imagePath } = req.file;

  // TODO refactor into helper in cloudinary.js
  let poster;
  try {
    const uploadResult = await uploadImage(imagePath);
    if (!uploadResult || !uploadResult.secure_url) {
      throw new Error('no secure_url from cloudinary upload');
    }
    poster = uploadResult.secure_url;
  } catch (e) {
    logger.error('Unable to upload file to cloudinary', e);
    return res.status(500).end();
  }

  const insertSeasonResult = await insertSeason({
    name,
    number,
    airDate,
    overview,
    poster,
    serieId,
  });

  if (insertSeasonResult) {
    return res.status(201).json(insertSeasonResult);
  }

  return res.status(500).end();
}

export async function seasonIdBySeasonNumber(serieId, seasonNumber) {
  try {
    const season = await singleQuery(
      `
        SELECT
          id
        FROM
          seasons
        WHERE
          serieId = $1 AND "number" = $2
      `,
      [serieId, seasonNumber],
    );

    if (season && season.id) {
      return season.id;
    }
  } catch (e) {
    logger.error(`unable to find seasonId based on serieId "${serieId}" and seasonNumber "${seasonNumber}"`, e);
  }

  return null;
}

export async function deleteSeason(req, res) {
  const { serieId, seasonId: seasonNumber } = req.params;

  // TODO error handling
  const actualSeasonId = await seasonIdBySeasonNumber(serieId, seasonNumber);

  try {
    const deletionRowCount = await deleteQuery(
      'DELETE FROM seasons WHERE serieId = $1 AND id = $2;',
      [serieId, actualSeasonId],
    );

    if (deletionRowCount === 0) {
      return res.status(404).end();
    }

    return res.status(200).json({});
  } catch (e) {
    logger.error(`unable to delete season "${seasonNumber}" in serie "${serieId}"`, e);
  }

  return res.status(500).json(null);
}
