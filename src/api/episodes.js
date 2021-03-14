import xss from 'xss';
import { deleteQuery, singleQuery } from '../db.js';
import { logger } from '../utils/logger.js';
import { seasonIdBySeasonNumber } from './seasons.js';

export async function listEpisode(_, { params = {} } = {}) {
  // TODO number/id mismatch
  const { serieId, seasonId: seasonNumber, episodeId: episodeNumber } = params;

  if (!seasonNumber) {
    return null;
  }

  const episode = await singleQuery(
    `
      SELECT
        episodes.id AS id,
        episodes.name AS name,
        episodes."number" AS "number",
        episodes.air_date AS air_date,
        episodes.overview AS overview,
        episodes.serieId AS serieId,
        seasons."number" AS seasonNumber,
        episodes.seasonId AS seasonId
      FROM
        episodes
      JOIN
        seasons ON seasons.id = episodes.seasonId
      WHERE
        episodes.serieId = $1 AND
        seasons."number" = $2 AND
        episodes."number" = $3
    `,
    [serieId, seasonNumber, episodeNumber],
  );

  if (!episode) {
    return null;
  }

  return episode;
}

export async function deleteEpisode(req, res) {
  const { serieId, seasonId: seasonNumber, episodeId: episodeNumber } = req.params;

  // TODO error handling
  const actualSeasonId = await seasonIdBySeasonNumber(serieId, seasonNumber);

  try {
    const deletionRowCount = await deleteQuery(
      `
        DELETE FROM episodes WHERE serieId = $1 AND seasonId = $2 AND "number" = $3;
      `,
      [serieId, actualSeasonId, episodeNumber],
    );

    if (deletionRowCount === 0) {
      return res.status(404).end();
    }

    return res.status(200).json({});
  } catch (e) {
    logger.error(`unable to delete episode "${episodeNumber}" in season "${seasonNumber}" in serie "${episodeNumber}"`, e);
  }

  return res.status(500).json(null);
}

export async function createEpisode(req, res) {
  // TODO seasonId/number mismatch
  const { serieId, seasonId: seasonNumber } = req.params;
  const {
    name, number, overview = null, airDate = null,
  } = req.body;

  // TODO error handling
  const actualSeasonId = await seasonIdBySeasonNumber(serieId, seasonNumber);

  try {
    // TODO refactor, use db.js insertEpisode
    const episode = await singleQuery(
      `
        INSERT INTO
          episodes (name, "number", air_date, overview, seasonId, serieId)
        VALUES
          ($1, $2, $3, $4, $5, $6)
        RETURNING
          id, name, "number", air_date, overview, seasonId, serieId
      `,
      [xss(name), xss(number), airDate, xss(overview), xss(actualSeasonId), xss(serieId)],
    );
    return res.status(201).json(episode);
  } catch (e) {
    logger.error('unable to create episode', e);
  }

  return res.status(500).json(null);
}
