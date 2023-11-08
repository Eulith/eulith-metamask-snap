import type {
  OnRpcRequestHandler,
  OnTransactionHandler,
} from '@metamask/snaps-types';
import { heading, panel, text } from '@metamask/snaps-ui';

type SetTokenRequest = {
  token: string;
};

export const onRpcRequest: OnRpcRequestHandler = async ({ request }) => {
  switch (request.method) {
    case 'eulith_snapSetToken': {
      if (!request.params || !Array.isArray(request.params)) {
        throw new Error('eulith_snapSetToken expected array of params.');
      }

      if (request.params.length !== 1) {
        throw new Error('eulith_snapSetToken expected exactly 1 param.');
      }

      const payload = request.params[0] as SetTokenRequest;
      return snap.request({
        method: 'snap_manageState',
        params: { operation: 'update', newState: { token: payload.token } },
      });
    }
    default:
      throw new Error('Method not found.');
  }
};

type StoredData = {
  token: string;
};

// { transaction, chainId, transactionOrigin }
export const onTransaction: OnTransactionHandler = async (_details) => {
  const storedData = (await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  })) as StoredData | null;

  if (!storedData) {
    return {
      content: panel([heading('Eulith'), text('Eulith token not set')]),
    };
  }

  return {
    content: panel([heading('Eulith'), text(`Token: ${storedData.token}`)]),
  };
};
