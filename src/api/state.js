import { singleQuery } from '../db.js';
import { logger } from '../utils/logger.js';

export async function createState(req, res) {
  const { serieId } = req.params;
  const { state } = req.body;
  const { id } = req.user;

  try {
    const createdRating = await singleQuery(
      `
        INSERT INTO
          users_series_state("user", state, serieId)
        VALUES
          ($1, $2, $3)
        RETURNING
          "user", state, serieId
      `,
      [id, state, serieId],
    );

    return res.status(201).json(createdRating);
  } catch (e) {
    logger.error(`unable to create state for "${serieId}" for user "${id}"`, e);
  }

  return res.status(500).json(null);
}

export async function updateState(req, res) {
  const { serieId } = req.params;
  const { state } = req.body;
  const { id } = req.user;

  try {
    const updatedRating = await singleQuery(
      `
      UPDATE users_series_state
        SET state = $1
      WHERE
        "user" = $2 AND serieId = $3
      RETURNING
        "user", state, serieId
      `,
      [state, id, serieId],
    );

    return res.status(200).json(updatedRating);
  } catch (e) {
    logger.error(`unable to update state of "${serieId}" for user "${id}"`, e);
  }

  return res.status(500).json(null);
}

export async function getSerieStateForUser(serieId, userId) {
  // TODO try catch

  const state = await singleQuery(
    `
      SELECT
        id, "user", state, serieid
      FROM
        users_series_state
      WHERE serieid = $1 AND "user" = $2
    `,
    [serieId, userId],
  );

  if (!state) {
    return null;
  }

  return state;
}

export async function listState(_, req) {
  const { serieId } = req.params;
  const { id } = req.user;

  return getSerieStateForUser(serieId, id);
}

export async function deleteState(req, res) {
  const { serieId } = req.params;
  const { id } = req.user;

  try {
    await singleQuery(
      `
      DELETE FROM users_series_state WHERE serieId = $1 AND "user" = $2
      `,
      [serieId, id],
    );

    return res.status(200).json({});
  } catch (e) {
    logger.error(`unable to delete state of "${serieId}" for user "${id}"`, e);
  }

  return res.status(500).json(null);
}
