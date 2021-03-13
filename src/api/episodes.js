import { singleQuery } from '../db.js';

export async function listEpisode(serieId, { params = {} } = {}) {
  const { season: seasonNumber, episode: episodeNumber } = params;

  if (!seasonNumber) {
    return null;
  }

  const episode = await singleQuery(
    `
      SELECT
        episodes.id AS id, episodes.name AS name, episodes."number" AS "number", episodes.air_date AS air_date, episodes.overview AS overview, episodes.serieId AS serieId, seasons."number" AS seasonNumber, episodes.seasonId AS seasonId
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

export const deleteEpisode = [
];

export const createEpisode = [
];
