import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Money } from '../../../domain/money.js';

export interface PayoutResult {
  payoutReference: string;
  maskedAccountReference: string;
}

/** Stand-in for a real core-banking payout rail (out of scope, Section 6.3). */
@Injectable()
export class StubPayoutAdapter {
  pay(amount: Money, accountNumber: string): PayoutResult {
    return {
      payoutReference: `PAYOUT-${randomUUID()}`,
      maskedAccountReference: maskAccountNumber(accountNumber),
    };
  }
}

/** NFR-03: the only form of the account number that may ever leave this module. */
export function maskAccountNumber(accountNumber: string): string {
  return `****${accountNumber.slice(-4)}`;
}
