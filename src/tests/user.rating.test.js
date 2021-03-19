import { test, describe, expect } from '@jest/globals';

import {
  createRandomUserAndReturnWithToken,
  deleteAndParse,
  fetchAndParse,
  patchAndParse,
  postAndParse,
} from './utils.js';

describe('tv series admin', () => {
  test('POST /tv/1/rate requires user', async () => {
    const { status } = await postAndParse('/tv/1/rate');

    expect(status).toBe(401);
  });

  test('POST /tv/999999/rate not found', async () => {
    const { token } = await createRandomUserAndReturnWithToken();
    expect(token).toBeTruthy();
    const { status } = await postAndParse('/tv/999999/rate', null, token);

    expect(status).toBe(404);
  });

  test('POST /tv/1/rate w/user, no rating', async () => {
    const { token } = await createRandomUserAndReturnWithToken();
    expect(token).toBeTruthy();

    const { result, status } = await postAndParse('/tv/1/rate', null, token);

    expect(status).toBe(400);
    expect(result.errors[0].msg).toBe('rating must be an integer, one of 0, 1, 2, 3, 4, 5');
  });

  test('POST /tv/1/rate w/user, invalid rating', async () => {
    const { token } = await createRandomUserAndReturnWithToken();
    expect(token).toBeTruthy();

    const data = { rating: 6 };
    const { result, status } = await postAndParse('/tv/1/rate', data, token);

    expect(status).toBe(400);
    expect(result.errors[0].msg).toBe('rating must be an integer, one of 0, 1, 2, 3, 4, 5');
  });

  test('POST /tv/1/rate w/user, valid rating', async () => {
    const { token, user } = await createRandomUserAndReturnWithToken();
    expect(token).toBeTruthy();

    const data = { rating: 5 };
    const { result, status } = await postAndParse('/tv/1/rate', data, token);

    expect(status).toBe(201);
    expect(result.user).toBe(user.id);
    expect(result.rating).toBe(5);
    expect(result.serieid).toBe(1);
  });

  test('POST /tv/1/rate w/user, rating exists', async () => {
    const { token, user } = await createRandomUserAndReturnWithToken();
    expect(token).toBeTruthy();

    const data = { rating: 5 };
    const { result, status } = await postAndParse('/tv/1/rate', data, token);

    expect(status).toBe(201);
    expect(result.user).toBe(user.id);
    expect(result.rating).toBe(5);
    expect(result.serieid).toBe(1);

    const { result: secondResult, status: secondStatus } = await postAndParse('/tv/1/rate', data, token);
    expect(secondStatus).toBe(400);
    expect(secondResult.errors[0].msg).toBe('already exists');
  });

  test('PATCH /tv/2/rate w/user, no rating exists', async () => {
    const { token } = await createRandomUserAndReturnWithToken();
    expect(token).toBeTruthy();

    const data = { rating: 5 };
    const { status } = await patchAndParse('/tv/2/rate', data, token);

    expect(status).toBe(404);
  });

  test('PATCH /tv/1/rate w/user, after creating', async () => {
    const { token, user } = await createRandomUserAndReturnWithToken();
    expect(token).toBeTruthy();

    const data = { rating: 5 };
    const { result, status } = await postAndParse('/tv/1/rate', data, token);
    expect(status).toBe(201);
    expect(result.user).toBe(user.id);
    expect(result.rating).toBe(5);
    expect(result.serieid).toBe(1);

    const patchData = { rating: 1 };
    const { result: patchResult, status: patchStatus } = await patchAndParse('/tv/1/rate', patchData, token);

    expect(patchStatus).toBe(200);
    expect(patchResult.user).toBe(user.id);
    expect(patchResult.rating).toBe(1);
    expect(patchResult.serieid).toBe(1);
  });

  test('DELETE /tv/1/rate after creating', async () => {
    const { token, user } = await createRandomUserAndReturnWithToken();
    expect(token).toBeTruthy();

    const data = { rating: 5 };
    const { result, status } = await postAndParse('/tv/1/rate', data, token);
    expect(status).toBe(201);
    expect(result.user).toBe(user.id);
    expect(result.rating).toBe(5);
    expect(result.serieid).toBe(1);

    const { status: deleteStatus } = await deleteAndParse('/tv/1/rate', null, token);

    expect(deleteStatus).toBe(200);
  });

  test('POST /tv/1/rate w/user, rating exists on series', async () => {
    const { token, user } = await createRandomUserAndReturnWithToken();
    expect(token).toBeTruthy();

    const data = { rating: 5 };
    const { result, status } = await postAndParse('/tv/1/rate', data, token);

    expect(status).toBe(201);
    expect(result.user).toBe(user.id);
    expect(result.rating).toBe(5);
    expect(result.serieid).toBe(1);

    const { result: fetchResult, status: fetchStatus } = await fetchAndParse('/tv/1', token);

    expect(fetchStatus).toBe(200);
    expect(fetchResult.id).toBe(1);
    expect(fetchResult.averagerating).toBeGreaterThanOrEqual(1);
    expect(fetchResult.ratingcount).toBeGreaterThanOrEqual(1);
    expect(fetchResult.rating).toBe(5);
  });
});
