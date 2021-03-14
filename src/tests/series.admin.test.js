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

describe('tv series admin', () => {
  test('POST /tv/ requires admin', async () => {
    const { status } = await postAndParse('/tv/');

    expect(status).toBe(401);
  });

  test('POST /tv/ requires admin, not user', async () => {
    const { token } = await createRandomUserAndReturnWithToken();
    expect(token).toBeTruthy();

    const { result, status } = await postAndParse('/tv/', null, token);

    expect(status).toBe(401);
    expect(result.error).toBe('insufficient authorization');
  });

  // TODO more thorough testing of each possible data in serie...

  test('POST /tv/ valid req data', async () => {
    const token = await loginAsHardcodedAdminAndReturnToken();
    expect(token).toBeTruthy();

    const name = `serie-${randomValue()}`;
    const data = {
      name,
      inproduction: 1,
      description: 'asdf',
      language: 'is',
      airDate: '2021-01-01',
    };
    const { result, status } = await postAndParse('/tv/', data, token, './test.png');

    expect(status).toBe(201);
    expect(result.name).toBe(name);
    expect(result.description).toBe('asdf');
    expect(result.image).toBeTruthy();
  });

  test('DELETE /tv/:id/ requires admin', async () => {
    const { status } = await deleteAndParse('/tv/99999');

    expect(status).toBe(401);
  });

  test('DELETE /tv/:id/ requires admin, not user', async () => {
    const { token } = await createRandomUserAndReturnWithToken();
    expect(token).toBeTruthy();

    const { result, status } = await deleteAndParse('/tv/9999', null, token);

    expect(status).toBe(401);
    expect(result.error).toBe('insufficient authorization');
  });

  test('DELETE /tv/:id success', async () => {
    const token = await loginAsHardcodedAdminAndReturnToken();
    expect(token).toBeTruthy();

    const name = `serie-${randomValue()}`;
    const data = {
      name,
      inproduction: 1,
      description: 'asdf',
      language: 'is',
      airDate: '2021-01-01',
    };
    const { result, status } = await postAndParse('/tv/', data, token, './test.png');

    expect(status).toBe(201);
    expect(result.name).toBe(name);
    expect(result.description).toBe('asdf');
    expect(result.image).toBeTruthy();

    const {
      result: deleteResult, status: deleteStatus,
    } = await deleteAndParse(`/tv/${result.id}`, null, token);

    expect(deleteStatus).toBe(200);
    expect(deleteResult).toEqual({});
  });
});
