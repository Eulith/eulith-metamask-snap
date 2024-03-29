import type { OnTransactionResponse } from '@metamask/snaps-sdk';
import type { Json } from '@metamask/utils';

import type {
  LegacyScreenTransactionResponse,
  ScreenTransactionFailureResponse,
  ScreenTransactionResponse,
  ScreenTransactionSuccessResponse,
  StoredData,
} from './types';
import * as ui from './ui';

export async function screenTransaction(transaction: {
  [key: string]: Json;
}): Promise<OnTransactionResponse> {
  const storedData = (await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  })) as StoredData | null;

  if (!storedData) {
    throw new Error(
      'Eulith services are not connected. Please navigate to https://eulithclient.com/metamask to set up this plugin.',
    );
  }

  const { token, whitelistId, eulithDomain } = storedData;

  const chainIdString = await ethereum.request({ method: 'eth_chainId' });
  if (!chainIdString) {
    throw new Error('Unable to fetch chain ID from Ethereum provider.');
  }
  const chainId = Number(chainIdString);
  const url = chainIdToUrl(eulithDomain, chainId);

  const response = await makeJsonRpcRequest(
    url,
    token,
    'eulith_screen_transaction',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    [{ whitelist_id: whitelistId, transactions: [transaction] }],
  );

  let results;
  try {
    results = convertLegacyResult(response);
  } catch (error) {
    return ui.serverError(response);
  }

  if (results.passed) {
    return ui.policyPassed();
  } else {
    return ui.policyFailed(whitelistId, results);
  }
}

async function makeJsonRpcRequest(
  url: URL,
  token: string,
  method: string,
  params: any[],
): Promise<any> {
  // can't use eulith client because axios doesn't work in the plugin sandbox
  // https://docs.metamask.io/snaps/how-to/troubleshoot/#axios
  let httpResponse;
  try {
    httpResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '1',
        method,
        params,
      }),
    });
  } catch (error: unknown) {
    console.error(error);
    throw new Error(
      'Failed to connect to Eulith backend services. Please try again later.',
    );
  }

  // only check for HTTP 500 as server will return HTTP 400 for policy failure
  if (httpResponse.status >= 500 && httpResponse.status < 600) {
    throw new Error(
      `Received an error response from Eulith backend services. HTTP ${httpResponse.status}. Please try again later.`,
    );
  } else if (httpResponse.status === 401) {
    throw new Error(
      'Please log in at eulithclient.com to access transaction insights.',
    );
  }

  return await httpResponse.json();
}

function convertLegacyResult(jsonRpc: any): ScreenTransactionResponse {
  /* eslint-disable @typescript-eslint/naming-convention */
  if (jsonRpc.error) {
    if (jsonRpc.error.data) {
      return jsonRpc.error.data as ScreenTransactionFailureResponse;
    } else {
      throw new Error('JSON-RPC error');
    }
  } else if (Array.isArray(jsonRpc.result)) {
    const legacyResults = jsonRpc.result as LegacyScreenTransactionResponse;
    if (legacyResults.length === 0) {
      return { passed: true };
    }

    const deniedCalls = [];
    const complianceDenials = [];

    for (const legacyResult of legacyResults) {
      deniedCalls.push(...legacyResult.denied_calls);
      complianceDenials.push(...legacyResult.denied_compliance);
    }

    return {
      passed: false,
      denied_calls: deniedCalls,
      compliance_denials: complianceDenials,
      traces: [],
    };
  } else {
    return jsonRpc.result as ScreenTransactionSuccessResponse;
  }
  /* eslint-enable @typescript-eslint/naming-convention */
}

function chainIdToUrl(eulithDomain: string, chainId: number): URL {
  if (eulithDomain.startsWith('localhost')) {
    return new URL(`http://${eulithDomain}/v0`);
  }

  let network;
  if (chainId === 1) {
    network = 'eth-main';
  } else if (chainId === 137) {
    network = 'poly-main';
  } else if (chainId === 42161) {
    network = 'arb-main';
  } else {
    throw new Error(
      `The current chain (id = ${chainId}) is not supported. Please contact Eulith if you are interested in trading on this chain.`,
    );
  }
  return new URL(`https://${network}.${eulithDomain}/v0`);
}
