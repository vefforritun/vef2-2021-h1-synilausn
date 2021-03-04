import { query, singleQuery, pagedQuery } from '../db.js';
import { addPageMetadata } from '../utils/addPageMetadata.js';
import { logger } from '../utils/logger.js';

async function serieGenres(id) {
  let genres = [];
  try {
    const result = await query(
      `SELECT
        genres.name
      FROM
        series_genres
      JOIN
        genres ON genres.id = series_genres.genre
      WHERE
        series_genres.serie = $1`,
      [id],
    );

    if (result.rows && result.rows.length > 0) {
      genres = result.rows;
    }
  } catch (e) {
    logger.warn('Unable to query genres for serie', id, e);
  }

  return genres;
}

async function serieSeasons(id) {
  let seasons = [];
  try {
    const result = await query(
      `SELECT
        name, "number", air_date, overview, poster
      FROM
        seasons
      WHERE
        serieId = $1`,
      [id],
    );

    if (result.rows && result.rows.length > 0) {
      seasons = result.rows;
    }
  } catch (e) {
    logger.warn('Unable to query seasons for serie', id, e);
  }

  return seasons;
}

export async function listSeries(req, res) {
  const { offset = 0, limit = 10 } = req.query;

  const series = await pagedQuery(
    `SELECT
        id, name, air_date, in_production, tagline, image, description, language, network, url
      FROM
        series
      ORDER BY id ASC`,
    [],
    { offset, limit },
  );

  const seriesWithPage = addPageMetadata(
    series,
    req.path,
    { offset, limit, length: series.items.length },
  );

  return res.json(seriesWithPage);
}

export async function listSerie(id) {
  /*
  TODO:
   * meðal einkunn
   * fjöldi einkunna
  */
  const serie = await singleQuery(
    `
      SELECT
        id, name, air_date, in_production, tagline, image, description, language, network, url
      FROM
        series
      WHERE id = $1
    `,
    [id],
  );

  if (!serie) {
    return null;
  }

  const genres = await serieGenres(id);
  const seasons = await serieSeasons(id);

  serie.genres = genres;
  serie.seasons = seasons;

  return serie;
}
