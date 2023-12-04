import type { OnTransactionResponse } from '@metamask/snaps-types';
import { copyable, heading, panel, text } from '@metamask/snaps-ui';

import type { ScreenTransactionFailureResponse } from './types';

export function policyPassed(): OnTransactionResponse {
  return {
    content: panel([
      heading('Eulith policy passed.'),
      text(
        'Your transaction was **deep-simulated** and it **passed** the security policy.',
      ),
    ]),
  };
}

export function policyFailed(
  whitelistId: number,
  results: ScreenTransactionFailureResponse,
): OnTransactionResponse {
  const nbsp = '\xa0';
  const content = panel([
    heading('This transaction may be unsafe.'),
    text(
      'Your transaction was **deep-simulated** and **did not pass** the security policy.',
    ),
    text(nbsp),
    text(
      `Carefully review the failures below. If this transaction is legitimate, you may need to add contract addresses to **your whitelist** at eulithclient.com (id=${whitelistId}).`,
    ),
  ]);

  let i = 1;
  for (const deniedCall of results.denied_calls) {
    const reason = deniedCall.reason;
    content.children.push(text(nbsp));
    content.children.push(heading(`Policy failure ${i}`));
    if (reason.type === 'EthDestination' && 'destination' in reason) {
      content.children.push(text(`ETH transfer to non-whitelisted address:`));
      content.children.push(text(nbsp));
      content.children.push(copyable(reason.destination));
    } else if (reason.type === 'Rule' && 'protocol' in reason) {
      content.children.push(text(`${reason.comment} (${reason.protocol})`));
      content.children.push(text(nbsp));
      content.children.push(
        text('Examined addresses (these may need to be whitelisted):'),
      );
      for (const address of reason.examined_addresses) {
        content.children.push(text(nbsp));
        content.children.push(copyable(address));
      }
    } else if (reason.type === 'Revert' && 'reason' in reason) {
      if (reason.reason) {
        content.children.push(
          text(`Transaction reverted with message: ${reason.reason}`),
        );
      } else {
        content.children.push(text('Transaction reverted.'));
      }
    } else {
      content.children.push(text('Transaction denied for unspecified reason.'));
      content.children.push(text(nbsp));
      content.children.push(copyable(JSON.stringify(reason)));
    }

    i += 1;
  }

  for (const complianceDenial of results.compliance_denials) {
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

  content.children.push(text(nbsp));
  content.children.push(heading('Full policy failure details'));
  content.children.push(copyable(JSON.stringify(results)));

  return {
    content,
  };
}

export function serverError(response: any): OnTransactionResponse {
  const message = response?.error?.message;
  if (typeof message === 'string') {
    return {
      content: panel([
        heading('Eulith returned an error response.'),
        text(`Message: ${message}`),
        copyable(JSON.stringify(response)),
      ]),
    };
  } else {
    return {
      content: panel([
        heading('Eulith returned an error response.'),
        copyable(JSON.stringify(response)),
      ]),
    };
  }
}
