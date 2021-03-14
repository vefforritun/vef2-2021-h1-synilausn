/* eslint-disable no-underscore-dangle */
import { test, describe, expect } from '@jest/globals';

import {
  createRandomUserAndReturnWithToken,
  deleteAndParse,
  getRandomInt,
  loginAsHardcodedAdminAndReturnToken,
  postAndParse,
  randomValue,
} from './utils.js';

describe('season admin', () => {
  test('POST /tv/:id/season requires admin', async () => {
    const { status } = await postAndParse('/tv/1/season/');

    expect(status).toBe(401);
  });

  test('POST /tv/:id/season requires admin, not user', async () => {
    const { token } = await createRandomUserAndReturnWithToken();
    expect(token).toBeTruthy();

    const { result, status } = await postAndParse('/tv/1/season', null, token);

    expect(status).toBe(401);
    expect(result.error).toBe('insufficient authorization');
  });

  test('POST /tv/:id/season/:season/episode w/admin invalid serie', async () => {
    const token = await loginAsHardcodedAdminAndReturnToken();
    expect(token).toBeTruthy();

    const data = {};
    const { result, status } = await postAndParse('/tv/a/season/', data, token);

    expect(status).toBe(400);
    // TODO brittle to rely on number here
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  test('POST /tv/:id/season/ valid req data, excl image', async () => {
    const token = await loginAsHardcodedAdminAndReturnToken();
    expect(token).toBeTruthy();

    const data = {
      name: 'x',
      number: '1',
    };
    const { result, status } = await postAndParse('/tv/1/season', data, token);

    expect(status).toBe(400);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].msg).toBe('image is required');
  });

  test('POST /tv/:id/season/ valid req data', async () => {
    const token = await loginAsHardcodedAdminAndReturnToken();
    expect(token).toBeTruthy();

    const name = `season-${randomValue()}`;
    const number = getRandomInt(30, 999999).toString();
    const data = {
      name,
      number,
    };
    const { result, status } = await postAndParse('/tv/1/season', data, token, './test.png');

    expect(status).toBe(201);
    expect(result.name).toBe(name);
    expect(result.number).toBe(number);
    expect(result.poster).toBeTruthy();
  });

  test('POST /tv/:id/season/ valid all data', async () => {
    const token = await loginAsHardcodedAdminAndReturnToken();
    expect(token).toBeTruthy();

    const name = `episode-${randomValue()}`;
    const number = getRandomInt(30, 999999).toString();
    const data = {
      name,
      number,
      airDate: '2021-01-01',
    };
    const { result, status } = await postAndParse('/tv/1/season', data, token, './test.png');

    expect(status).toBe(201);
    expect(result.name).toBe(name);
    expect(result.number).toBe(number);
    expect(result.poster).toBeTruthy();
  });

  test('DELETE /tv/:id/season/ requires admin', async () => {
    const { status } = await deleteAndParse('/tv/1/season/9999');

    expect(status).toBe(401);
  });

  test('DELETE /tv/:id/season/ requires admin, not user', async () => {
    const { token } = await createRandomUserAndReturnWithToken();
    expect(token).toBeTruthy();

    const { result, status } = await deleteAndParse('/tv/1/season/9999', null, token);

    expect(status).toBe(401);
    expect(result.error).toBe('insufficient authorization');
  });

  test('DELETE /tv/:id/season/:num success', async () => {
    const token = await loginAsHardcodedAdminAndReturnToken();
    expect(token).toBeTruthy();

    const name = `season-${randomValue()}`;
    const number = getRandomInt(30, 999999).toString();
    const data = {
      name,
      number,
    };
    const { result, status } = await postAndParse('/tv/1/season', data, token, './test.png');

    expect(status).toBe(201);
    expect(result.name).toBe(name);
    expect(result.number).toBe(number);
    expect(result.poster).toBeTruthy();

    const {
      result: deleteResult, status: deleteStatus,
    } = await deleteAndParse(`/tv/1/season/${number}`, null, token);

    expect(deleteStatus).toBe(200);
    expect(deleteResult).toEqual({});
  });
});
