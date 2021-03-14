/* eslint-disable no-underscore-dangle */
import { test, describe, expect } from '@jest/globals';

import {
  createRandomUserAndReturnWithToken,
  loginAsHardcodedAdminAndReturnToken,
  postAndParse,
  randomValue,
} from './utils.js';

describe('/genres admin', () => {
  test('POST /genres requires admin', async () => {
    const { status } = await postAndParse('/genres');

    expect(status).toBe(401);
  });

  test('POST /genres requires admin, not user', async () => {
    const { token } = await createRandomUserAndReturnWithToken();
    expect(token).toBeTruthy();

    const { result, status } = await postAndParse('/genres', null, token);

    expect(status).toBe(401);
    expect(result.error).toBe('insufficient authorization');
  });

  test('POST /genres w/admin invalid data', async () => {
    const token = await loginAsHardcodedAdminAndReturnToken();
    expect(token).toBeTruthy();

    const data = {};
    const { result, status } = await postAndParse('/genres', data, token);

    expect(status).toBe(400);
    expect(result.errors[0].msg).toBe('name is required, max 128 characters');
  });

  test('POST /genres w/admin empty name', async () => {
    const token = await loginAsHardcodedAdminAndReturnToken();
    expect(token).toBeTruthy();

    const data = { name: '' };
    const { result, status } = await postAndParse('/genres', data, token);

    expect(status).toBe(400);
    expect(result.errors[0].msg).toBe('name is required, max 128 characters');
  });

  test('POST /genres w/admin success', async () => {
    const token = await loginAsHardcodedAdminAndReturnToken();
    expect(token).toBeTruthy();

    const name = `genre-${randomValue()}`;
    const data = { name };
    const { result, status } = await postAndParse('/genres', data, token);

    expect(status).toBe(201);
    expect(result.name).toBe(name);
  });
});
