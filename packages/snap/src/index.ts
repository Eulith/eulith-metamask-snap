import type {
  OnRpcRequestHandler,
  OnTransactionHandler,
} from '@metamask/snaps-types';
import { copyable, heading, panel, text } from '@metamask/snaps-ui';
import * as Eulith from 'eulith-web3js';

type SetAccountRequest = {
  token: string;
  authAddress: string;
};

export const onRpcRequest: OnRpcRequestHandler = async ({ request }) => {
  switch (request.method) {
    case 'eulith_snapSetAccount': {
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
          newState: { token: payload.token, authAddress: payload.authAddress },
        },
      });
    }
    default:
      throw new Error('Method not found.');
  }
};

type StoredData = {
  token: string;
  authAddress: string;
};

/* eslint-disable @typescript-eslint/naming-convention */
type ScreenTransactionResponse = {
  gas_used: number;
  approved: boolean;
  denied_compliance: any[];
  denied_calls: any[];
  revert_message: string | null;
}[];
/* eslint-enable @typescript-eslint/naming-convention */

// { transaction, chainId, transactionOrigin }
export const onTransaction: OnTransactionHandler = async ({ transaction }) => {
  const storedData = (await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  })) as StoredData | null;

  if (!storedData) {
    return {
      content: panel([heading('Eulith'), text('Eulith token not set')]),
    };
  }

  // const provider = new Eulith.Provider({
  //   network: Eulith.Networks.Predefined.mainnet.with({
  //     eulithURL: 'http://localhost:7777',
  //   }),
  //   auth: Eulith.Auth.fromToken(storedData.token),
  // });
  //
  // const response = await provider.request({
  //   method: 'eulith_screen_transaction',
  //   params: [transaction],
  // });

  const { token, authAddress } = storedData;

  // TODO: can't use eulith client lib?
  const httpResponse = await fetch(
    // TODO: construct URL properly
    // TODO: how do we know network?
    // `http://localhost:7777/v0?auth_address=${authAddress}`,
    `https://arb-main.eulithrpc.com/v0?auth_address=${authAddress}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '1',
        method: 'eulith_screen_transaction',
        params: [transaction],
      }),
    },
  );
  const response = await httpResponse.json();

  if (response.error) {
    return {
      content: panel([
        heading('Eulith'),
        text('Error'),
        copyable(JSON.stringify(response)),
      ]),
    };
  }

  const results = response.result as ScreenTransactionResponse;

  if (results.length === 0) {
    return {
      content: panel([heading('Eulith'), text('Policy passed.')]),
    };
  }

  // TODO: error formatting?
  return {
    content: panel([
      heading('Eulith'),
      text('Policy failed.'),
      copyable(JSON.stringify(results)),
    ]),
  };
};
