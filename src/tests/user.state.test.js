import { test, describe, expect } from '@jest/globals';

import {
  createRandomUserAndReturnWithToken,
  deleteAndParse,
  fetchAndParse,
  patchAndParse,
  postAndParse,
} from './utils.js';

describe('tv series admin', () => {
  test('POST /tv/1/state requires user', async () => {
    const { status } = await postAndParse('/tv/1/state');

    expect(status).toBe(401);
  });

  test('POST /tv/999999/state not found', async () => {
    const { token } = await createRandomUserAndReturnWithToken();
    expect(token).toBeTruthy();
    const { status } = await postAndParse('/tv/999999/state', null, token);

    expect(status).toBe(404);
  });

  test('POST /tv/1/state w/user, no rating', async () => {
    const { token } = await createRandomUserAndReturnWithToken();
    expect(token).toBeTruthy();

    const { result, status } = await postAndParse('/tv/1/state', null, token);

    expect(status).toBe(400);
    expect(result.errors[0].msg).toBe('state must be one of "want to watch", "watching", "watched"');
  });

  test('POST /tv/1/state w/user, invalid state', async () => {
    const { token } = await createRandomUserAndReturnWithToken();
    expect(token).toBeTruthy();

    const data = { state: 'x' };
    const { result, status } = await postAndParse('/tv/1/state', data, token);

    expect(status).toBe(400);
    expect(result.errors[0].msg).toBe('state must be one of "want to watch", "watching", "watched"');
  });

  test('POST /tv/1/state w/user, valid rating', async () => {
    const { token, user } = await createRandomUserAndReturnWithToken();
    expect(token).toBeTruthy();

    const data = { state: 'want to watch' };
    const { result, status } = await postAndParse('/tv/1/state', data, token);

    expect(status).toBe(201);
    expect(result.user).toBe(user.id);
    expect(result.state).toBe('want to watch');
    expect(result.serieid).toBe(1);
  });

  test('POST /tv/1/state w/user, state exists', async () => {
    const { token, user } = await createRandomUserAndReturnWithToken();
    expect(token).toBeTruthy();

    const data = { state: 'want to watch' };
    const { result, status } = await postAndParse('/tv/1/state', data, token);

    expect(status).toBe(201);
    expect(result.user).toBe(user.id);
    expect(result.state).toBe('want to watch');
    expect(result.serieid).toBe(1);

    const { result: secondResult, status: secondStatus } = await postAndParse('/tv/1/state', data, token);
    expect(secondStatus).toBe(400);
    expect(secondResult.errors[0].msg).toBe('already exists');
  });

  test('PATCH /tv/2/state w/user, no state exists', async () => {
    const { token } = await createRandomUserAndReturnWithToken();
    expect(token).toBeTruthy();

    const data = { state: 'want to watch' };
    const { status } = await patchAndParse('/tv/2/state', data, token);

    expect(status).toBe(404);
  });

  test('PATCH /tv/1/state w/user, after creating', async () => {
    const { token, user } = await createRandomUserAndReturnWithToken();
    expect(token).toBeTruthy();

    const data = { state: 'want to watch' };
    const { result, status } = await postAndParse('/tv/1/state', data, token);
    expect(status).toBe(201);
    expect(result.user).toBe(user.id);
    expect(result.state).toBe('want to watch');
    expect(result.serieid).toBe(1);

    const patchData = { state: 'watched' };
    const { result: patchResult, status: patchStatus } = await patchAndParse('/tv/1/state', patchData, token);

    expect(patchStatus).toBe(200);
    expect(patchResult.user).toBe(user.id);
    expect(patchResult.state).toBe('watched');
    expect(patchResult.serieid).toBe(1);
  });

  test('DELETE /tv/1/state after creating', async () => {
    const { token, user } = await createRandomUserAndReturnWithToken();
    expect(token).toBeTruthy();

    const data = { state: 'watched' };
    const { result, status } = await postAndParse('/tv/1/state', data, token);
    expect(status).toBe(201);
    expect(result.user).toBe(user.id);
    expect(result.state).toBe('watched');
    expect(result.serieid).toBe(1);

    const { status: deleteStatus } = await deleteAndParse('/tv/1/state', null, token);

    expect(deleteStatus).toBe(200);
  });

  test('POST /tv/1/state w/user, state exists on series', async () => {
    const { token, user } = await createRandomUserAndReturnWithToken();
    expect(token).toBeTruthy();

    const data = { state: 'want to watch' };
    const { result, status } = await postAndParse('/tv/1/state', data, token);

    expect(status).toBe(201);
    expect(result.user).toBe(user.id);
    expect(result.state).toBe('want to watch');
    expect(result.serieid).toBe(1);

    const { result: fetchResult, status: fetchStatus } = await fetchAndParse('/tv/1', token);

    expect(fetchStatus).toBe(200);
    expect(fetchResult.id).toBe(1);
    expect(fetchResult.state).toBe('want to watch');
  });
});
