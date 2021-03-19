import { singleQuery } from '../db.js';
import { logger } from '../utils/logger.js';

export async function createRating(req, res) {
  const { serieId } = req.params;
  const { rating } = req.body;
  const { id } = req.user;

  try {
    const createdRating = await singleQuery(
      `
        INSERT INTO
          users_series_rating("user", rating, serieId)
        VALUES
          ($1, $2, $3)
        RETURNING
          "user", rating, serieId
      `,
      [id, rating, serieId],
    );

    return res.status(201).json(createdRating);
  } catch (e) {
    logger.error(`unable to create rating of "${serieId}" for user "${id}"`, e);
  }

  return res.status(500).json(null);
}

export async function updateRating(req, res) {
  const { serieId } = req.params;
  const { rating } = req.body;
  const { id } = req.user;

  try {
    const updatedRating = await singleQuery(
      `
      UPDATE users_series_rating
        SET rating = $1
      WHERE
        "user" = $2 AND serieId = $3
      RETURNING
        "user", rating, serieId
      `,
      [rating, id, serieId],
    );

    return res.status(200).json(updatedRating);
  } catch (e) {
    logger.error(`unable to update rating of "${serieId}" for user "${id}"`, e);
  }

  return res.status(500).json(null);
}

export async function getSerieRatingForUser(serieId, userId) {
  // TODO try catch

  const rating = await singleQuery(
    `
      SELECT
        id, "user", rating, serieid
      FROM
        users_series_rating
      WHERE serieid = $1 AND "user" = $2
    `,
    [serieId, userId],
  );

  if (!rating) {
    return null;
  }

  return rating;
}

export async function listRating(_, req) {
  const { serieId } = req.params;
  const { id } = req.user;

  return getSerieRatingForUser(serieId, id);
}

export async function deleteRating(req, res) {
  const { serieId } = req.params;
  const { id } = req.user;

  try {
    await singleQuery(
      `
      DELETE FROM users_series_rating WHERE serieId = $1 AND "user" = $2
      `,
      [serieId, id],
    );

    return res.status(200).json({});
  } catch (e) {
    logger.error(`unable to delete rating of "${serieId}" for user "${id}"`, e);
  }

  return res.status(500).json(null);
}
