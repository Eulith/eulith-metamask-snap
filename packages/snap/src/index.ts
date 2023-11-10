import type {
  OnRpcRequestHandler,
  OnTransactionHandler,
} from '@metamask/snaps-types';

import { handleSnapSetAccount } from './snapRpc';
import { screenTransaction } from './txInsights';

export const onRpcRequest: OnRpcRequestHandler = async ({ request }) => {
  switch (request.method) {
    case 'eulith_snapSetAccount': {
      return handleSnapSetAccount(request);
    }
    default:
      throw new Error('Method not found.');
  }
};

// { transaction, chainId, transactionOrigin }
export const onTransaction: OnTransactionHandler = async ({ transaction }) => {
  return await screenTransaction(transaction);
};
