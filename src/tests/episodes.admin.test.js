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

describe('episodes admin', () => {
  test('POST /tv/:id/season/:season/episode requires admin', async () => {
    const { status } = await postAndParse('/tv/1/season/1/episode');

    expect(status).toBe(401);
  });

  test('POST /tv/:id/season/:season/episode requires admin, not user', async () => {
    const { token } = await createRandomUserAndReturnWithToken();
    expect(token).toBeTruthy();

    const { result, status } = await postAndParse('/tv/1/season/1/episode', null, token);

    expect(status).toBe(401);
    expect(result.error).toBe('insufficient authorization');
  });

  test('POST /tv/:id/season/:season/episode w/admin invalid data', async () => {
    const token = await loginAsHardcodedAdminAndReturnToken();
    expect(token).toBeTruthy();

    const data = {};
    const { result, status } = await postAndParse('/tv/a/season/b/episode', data, token);

    expect(status).toBe(400);
    // TODO brittle to rely on number here
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });

  test('POST /tv/:id/season/:season/episode valid req data, excl name', async () => {
    const token = await loginAsHardcodedAdminAndReturnToken();
    expect(token).toBeTruthy();

    const data = {
      name: '',
      number: '1',
    };
    const { result, status } = await postAndParse('/tv/1/season/1/episode', data, token);

    expect(status).toBe(400);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].msg).toBe('name is required, max 128 characters');
  });

  test('POST /tv/:id/season/:season/episode valid req data, excl number', async () => {
    const token = await loginAsHardcodedAdminAndReturnToken();
    expect(token).toBeTruthy();

    const data = {
      name: 'x',
      number: 'x',
    };
    const { result, status } = await postAndParse('/tv/1/season/1/episode', data, token);

    expect(status).toBe(400);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].msg).toBe('number must be an integer larger than 0');
  });

  test('POST /tv/:id/season/:season/episode valid req data, excl seasonId', async () => {
    const token = await loginAsHardcodedAdminAndReturnToken();
    expect(token).toBeTruthy();

    const data = {
      name: 'x',
      number: '1',
    };
    const { result, status } = await postAndParse('/tv/1/season/a/episode', data, token);

    expect(status).toBe(400);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].msg).toBe('seasonId must be an integer larger than 0');
  });

  test('POST /tv/:id/season/:season/episode valid req data, excl serieId', async () => {
    const token = await loginAsHardcodedAdminAndReturnToken();
    expect(token).toBeTruthy();

    const data = {
      name: 'x',
      number: '1',
    };
    const { result, status } = await postAndParse('/tv/a/season/1/episode', data, token);

    expect(status).toBe(400);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].msg).toBe('serieId must be an integer larger than 0');
  });

  test('POST /tv/:id/season/:season/episode valid req data, invalid overview', async () => {
    const token = await loginAsHardcodedAdminAndReturnToken();
    expect(token).toBeTruthy();

    const data = {
      name: 'x',
      number: '1',
      overview: false, // optional
    };
    const { result, status } = await postAndParse('/tv/1/season/1/episode', data, token);

    expect(status).toBe(400);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].msg).toBe('overview must be a string');
  });

  test('POST /tv/:id/season/:season/episode valid req data, invalid airDate', async () => {
    const token = await loginAsHardcodedAdminAndReturnToken();
    expect(token).toBeTruthy();

    const data = {
      name: 'x',
      number: '1',
      airDate: 'x', // optional
    };
    const { result, status } = await postAndParse('/tv/1/season/1/episode', data, token);

    expect(status).toBe(400);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].msg).toBe('airDate must be a date');
  });

  test('POST /tv/:id/season/:season/episode succes w/valid req data', async () => {
    const token = await loginAsHardcodedAdminAndReturnToken();
    expect(token).toBeTruthy();

    const name = `episode-${randomValue()}`;
    const number = getRandomInt(30, 999999).toString();
    const data = {
      name,
      number,
    };
    const { result, status } = await postAndParse('/tv/1/season/1/episode', data, token);

    expect(status).toBe(201);
    expect(result.name).toBe(name);
    expect(result.number).toBe(number);
  });

  test('DELETE /tv/:id/season/:season/episode/:num requires admin', async () => {
    const { status } = await deleteAndParse('/tv/1/season/1/episode/999');

    expect(status).toBe(401);
  });

  test('DELETE /tv/:id/season/:season/episode/:num requires admin, not user', async () => {
    const { token } = await createRandomUserAndReturnWithToken();
    expect(token).toBeTruthy();

    const { result, status } = await deleteAndParse('/tv/1/season/1/episode/999', null, token);

    expect(status).toBe(401);
    expect(result.error).toBe('insufficient authorization');
  });

  test('DELETE /tv/:id/season/:season/episode/:num success', async () => {
    const token = await loginAsHardcodedAdminAndReturnToken();
    expect(token).toBeTruthy();

    const name = `episode-${randomValue()}`;
    const number = '9999';
    const data = {
      name,
      number,
    };
    const { result, status } = await postAndParse('/tv/1/season/1/episode', data, token);

    expect(status).toBe(201);
    expect(result.id).toBeGreaterThanOrEqual(1);
    expect(result.name).toBe(name);
    expect(result.number).toBe(number);

    const {
      result: deleteResult, status: deleteStatus,
    } = await deleteAndParse(`/tv/1/season/1/episode/${number}`, null, token);

    expect(deleteStatus).toBe(200);
    expect(deleteResult).toEqual({});
  });
});
