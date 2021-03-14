import {
  query, singleQuery, pagedQuery, insertSerie, deleteQuery,
} from '../db.js';
import { addPageMetadata } from '../utils/addPageMetadata.js';
import { uploadImage } from '../utils/cloudinary.js';
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

export async function listSerie(_, { params = {} } = {}) {
  const { serieId: id } = params;
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

export async function createSerie(req, res) {
  const {
    name,
    airDate = null,
    inProduction,
    tagline = null,
    description,
    language,
    network = null,
    url = null,
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

  const insertSeasonResult = await insertSerie({
    name,
    airDate,
    inProduction,
    tagline,
    image: poster,
    description,
    language,
    network,
    url,
  });

  if (insertSeasonResult) {
    return res.status(201).json(insertSeasonResult);
  }

  return res.status(500).end();
}

export async function deleteSerie(req, res) {
  const { serieId } = req.params;

  try {
    const deletionRowCount = await deleteQuery(
      'DELETE FROM series WHERE id = $1;',
      [serieId],
    );

    if (deletionRowCount === 0) {
      return res.status(404).end();
    }

    return res.status(200).json({});
  } catch (e) {
    logger.error(`unable to delete serie "${serieId}"`, e);
  }

  return res.status(500).json(null);
}

export async function updateSerie(req, res) {

}
