export type StoredData = {
  token: string;
  whitelistId: number;
  eulithDomain: string;
};

/* eslint-disable @typescript-eslint/naming-convention */

export type ScreenTransactionResponse =
  | ScreenTransactionSuccessResponse
  | ScreenTransactionFailureResponse;

export type ScreenTransactionSuccessResponse = {
  passed: boolean;
};

// called ArmorCommitResponse in the backend
export type ScreenTransactionFailureResponse = {
  denied_calls: DeniedCall[];
  compliance_denials: AddressComplianceResult[];
  traces: string[];
};

export type DeniedCall = {
  rule_id: number;
  reason: DenialReason;
  call: SimulatedCall;
};

export type DenialReason =
  | EthDestinationDenialReason
  | RuleDenialReason
  | RevertDenialReason
  | UnknownDenialReason;

export type EthDestinationDenialReason = {
  type: 'EthDestination';
  destination: string;
};

export type RuleDenialReason = {
  type: 'Rule';
  function: string;
  protocol: string;
  failing_rule_index: number;
  matched_rule: RuleExplanation[];
  examined_addresses: string[];
  comment: string | null;
};

export type RevertDenialReason = {
  type: 'Revert';
  reason: string;
};

export type UnknownDenialReason = {
  type: Exclude<string, 'EthDestination' | 'Revert' | 'Rule'>;
};

export type RuleExplanation = {
  text: string;
  conditions: string[];
};

export type SimulatedCall = {
  tx: { from: string | null; data: string; to: string; value: string };
  call_type: string;
};

export type AddressComplianceResult = {
  address: string;
  // floating-point percentage, 0.0-1.0
  risk_score: number;
  risk_explanation: string | null;
};

export type LegacyScreenTransactionResponse = {
  gas_used: number;
  approved: boolean;
  denied_compliance: AddressComplianceResult[];
  denied_calls: DeniedCall[];
  revert_message: string | null;
}[];

/* eslint-enable @typescript-eslint/naming-convention */
