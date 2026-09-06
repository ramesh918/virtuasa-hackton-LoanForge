import { MongoClient } from 'mongodb';
import { randomUUID } from 'node:crypto';

/**
 * Direct-to-Mongo test fixtures. LoanForge has no HTTP endpoint yet that auto-runs
 * eligibility+pricing on submit (that orchestration doesn't exist in this build) — so to reach
 * UNDER_REVIEW/APPROVED states for a UI test, fixtures write those states/offers directly, the same
 * way the eligibility/pricing services themselves would. Business logic (the rules that decide *what*
 * state an application should be in) is exercised by the 47 backend unit/controller tests, not here —
 * this suite only exercises the UI + controller wiring for states already reachable at fixture-setup
 * time.
 */

const MONGO_URI =
  process.env.E2E_MONGO_URI ?? 'mongodb://localhost:27117/loanforge?replicaSet=rs0&directConnection=true';

let client: MongoClient | undefined;

async function db() {
  if (!client) {
    client = new MongoClient(MONGO_URI);
    await client.connect();
  }
  return client.db();
}

export async function closeFixtureConnection(): Promise<void> {
  await client?.close();
  client = undefined;
}

/** A unique applicant+product combo per call so repeated test runs never hit AC-05's duplicate check. */
export function uniqueApplicantAndProduct(): { applicantId: string; productId: string } {
  const suffix = randomUUID().slice(0, 8);
  return { applicantId: `E2E-${suffix}`, productId: 'PRD-PERSONAL' };
}

export async function setApplicationState(applicationId: string, state: string): Promise<void> {
  const database = await db();
  await database.collection('applications').updateOne({ applicationId }, { $set: { state } });
}

/** Disbursement needs an applicant profile with an account number on file (eligibility's collection). */
export async function insertApplicantProfile(applicantId: string): Promise<void> {
  const database = await db();
  await database.collection('applicants').updateOne(
    { applicantId },
    {
      $set: {
        applicantId,
        name: 'E2E Test Applicant',
        income: '5200.00',
        age: 34,
        employmentType: 'SALARIED',
        accountNumber: '4000000000009999',
      },
    },
    { upsert: true },
  );
}

export async function insertOffer(applicationId: string, tenureMonths: number): Promise<void> {
  const database = await db();
  await database.collection('offers').updateOne(
    { applicationId },
    {
      $set: {
        applicationId,
        rateBandLabel: 'PRIME',
        annualRate: '0.10',
        emi: '351.66',
        tenureMonths,
        totalPayable: '4219.96',
      },
    },
    { upsert: true },
  );
}
