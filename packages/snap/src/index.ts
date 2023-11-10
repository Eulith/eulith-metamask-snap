import type {
  OnRpcRequestHandler,
  OnTransactionHandler,
} from '@metamask/snaps-types';
import { copyable, heading, panel, text } from '@metamask/snaps-ui';

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

  const { token, authAddress } = storedData;

  const chainIdString = await ethereum.request({ method: 'eth_chainId' });
  if (!chainIdString) {
    throw new Error('Unable to fetch chain ID from Ethereum provider.');
  }
  const chainId = Number(chainIdString);
  const url = chainIdToUrl(chainId);
  url.searchParams.append('auth_address', authAddress);

  // can't use eulith client because axios doesn't work in the plugin sandbox
  // https://docs.metamask.io/snaps/how-to/troubleshoot/#axios
  const httpResponse = await fetch(url, {
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
  });
  const response = await httpResponse.json();

  if (response.error) {
    return {
      content: panel([
        heading('Eulith returned error response.'),
        copyable(JSON.stringify(response)),
      ]),
    };
  }

  const results = response.result as ScreenTransactionResponse;
  if (results.length === 0) {
    return {
      content: panel([
        heading('Eulith policy passed.'),
        text(
          'Your transaction was **deep-simulated** and it **passed** the security policy.',
        ),
      ]),
    };
  }

  const nbsp = '\xa0';
  const content = panel([
    heading('This transaction may be unsafe.'),
    text(
      'Your transaction was **deep-simulated** and **did not pass** the security policy.',
    ),
    text(nbsp),
    text(
      'Carefully review the failures below. If this transaction is legitimate, you may need to add contract addresses to **your whitelist** at eulithclient.com',
    ),
  ]);

  let i = 1;
  for (const result of results) {
    for (const deniedCall of result.denied_calls) {
      const reason = deniedCall.reason;
      content.children.push(text(nbsp));
      content.children.push(heading(`Policy failure ${i}`));
      if (reason.type === 'EthDestination') {
        content.children.push(text(`ETH transfer to non-whitelisted address:`));
        content.children.push(text(nbsp));
        content.children.push(copyable(reason.destination));
      } else {
        content.children.push(text(`${reason.comment} (${reason.protocol})`));
        content.children.push(text(nbsp));
        // content.children.push(divider());
        content.children.push(
          text('Examined addresses (these may need to be whitelisted):'),
        );
        for (const address of reason.examined_addresses) {
          content.children.push(text(nbsp));
          content.children.push(copyable(address));
        }
      }

      i += 1;
    }

    for (const complianceDenial of result.denied_compliance) {
      content.children.push(text(nbsp));
      content.children.push(heading(`Policy failure ${i}`));
      const explanation = complianceDenial.risk_explanation
        ? ` (${complianceDenial.risk_explanation})`
        : '';
      content.children.push(
        text(`Address was flagged as a compliance risk${explanation}`),
      );
      content.children.push(text(nbsp));
      content.children.push(copyable(complianceDenial.address));
    }
  }

  content.children.push(text(nbsp));
  content.children.push(heading('Full policy failure details'));
  content.children.push(copyable(JSON.stringify(results)));

  return {
    content,
  };
};

function chainIdToUrl(chainId: number): URL {
  const baseUrl = 'eulithrpc.com/v0';
  let network;
  if (chainId === 1) {
    network = 'eth-main';
  } else if (chainId === 137) {
    network = 'poly-main';
  } else if (chainId === 42161) {
    network = 'arb-main';
  } else {
    throw new Error(`Unknown chain ID: ${chainId}`);
  }
  return new URL(`https://${network}.${baseUrl}`);
}
