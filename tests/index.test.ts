import { expect } from '@jest/globals';
import { installSnap } from '@metamask/snaps-jest';

describe('onRpcRequest', () => {
  describe('eulith_snapSetAccount', () => {
    it('succeeds', async () => {
      const { request } = await installSnap();

      const origin = 'Jest';
      const response = request({
        method: 'eulith_snapSetAccount',
        params: [
          {
            whitelistId: 1,
            eulithDomain: 'localhost:7777',
            token: 'token',
          },
        ],
        origin,
      });

      expect(await response).toRespondWith(null);
    });
  });

  it('throws an error if the requested method does not exist', async () => {
    const { request, close } = await installSnap();

    const response = await request({
      method: 'foo',
    });

    expect(response).toRespondWithError({
      code: -32603,
      message: 'Method not found.',
      stack: expect.any(String),
    });

    await close();
  });
});
