import type { JsonRpcRequest } from '@metamask/snaps-types';

type SetAccountRequest = {
  token: string;
  whitelistId: number;
  eulithDomain: string;
};

export async function handleSnapSetAccount(request: JsonRpcRequest) {
  console.log('eulith_snapSetAccount request received.');

  if (!request.params || !Array.isArray(request.params)) {
    throw new Error('eulith_snapSetAccount expected array of params.');
  }

  if (request.params.length !== 1) {
    throw new Error('eulith_snapSetAccount expected exactly 1 param.');
  }

  const payload = request.params[0] as SetAccountRequest;
  return snap.request({
    method: 'snap_manageState',
    params: {
      operation: 'update',
      newState: payload,
    },
  });
}
