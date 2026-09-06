import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Money } from '../../../domain/money.js';

export interface BureauPullResult {
  creditScore: number;
  existingMonthlyObligations: Money;
}

const MIN_SCORE = 300;
const MAX_SCORE = 850;
const MAX_OBLIGATIONS = 2000;

/** Deterministic stand-in for a real credit bureau integration (out of scope, Section 6.3). */
@Injectable()
export class BureauStubService {
  pull(applicantId: string): BureauPullResult {
    const digest = createHash('sha256').update(applicantId).digest();
    const scoreFraction = digest.readUInt16BE(0) / 0xffff;
    const obligationsFraction = digest.readUInt16BE(2) / 0xffff;

    const creditScore = Math.round(MIN_SCORE + scoreFraction * (MAX_SCORE - MIN_SCORE));
    const existingMonthlyObligations = Money.of(
      (obligationsFraction * MAX_OBLIGATIONS).toFixed(2),
    );

    return { creditScore, existingMonthlyObligations };
  }
}
