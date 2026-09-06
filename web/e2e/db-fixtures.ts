import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

/**
 * Direct-to-SQLite test fixtures. LoanForge has no HTTP endpoint yet that auto-runs
 * eligibility+pricing on submit for every case (the orchestration endpoint exists but requires a
 * seeded applicant profile to pass deterministically) — so to reach APPROVED/offer-ready states for
 * a UI test, fixtures write those states/offers directly, the same way the eligibility/pricing
 * services themselves would. Business logic (the rules that decide *what* state an application
 * should be in) is exercised by the backend unit/controller tests, not here — this suite exercises
 * UI + controller wiring for states already reachable at fixture-setup time.
 */

// Anchored to this file's own location, not process.cwd() — must resolve to the same absolute file
// src/api/src/app.module.ts's DEFAULT_SQLITE_PATH does (see that file's comment for the bug this
// pattern avoids: npm workspace scripts run with cwd set to the workspace directory).
const DEFAULT_SQLITE_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../../src/api/loanforge.sqlite');
const SQLITE_DB_PATH = process.env.E2E_SQLITE_DB_PATH ?? DEFAULT_SQLITE_PATH;

let db: Database.Database | undefined;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(SQLITE_DB_PATH);
  }
  return db;
}

export async function closeFixtureConnection(): Promise<void> {
  db?.close();
  db = undefined;
}

/** A unique applicant+product combo per call so repeated test runs never hit AC-05's duplicate check. */
export function uniqueApplicantAndProduct(): { applicantId: string; productId: string } {
  const suffix = randomUUID().slice(0, 8);
  return { applicantId: `E2E-${suffix}`, productId: 'PRD-PERSONAL' };
}

export async function setApplicationState(applicationId: string, state: string): Promise<void> {
  getDb().prepare('UPDATE applications SET state = ? WHERE applicationId = ?').run(state, applicationId);
}

/** Disbursement needs an applicant profile with an account number on file (eligibility's table). */
export async function insertApplicantProfile(applicantId: string): Promise<void> {
  getDb()
    .prepare(
      `INSERT INTO applicants (applicantId, name, income, age, employmentType, accountNumber)
       VALUES (@applicantId, @name, @income, @age, @employmentType, @accountNumber)
       ON CONFLICT(applicantId) DO UPDATE SET
         name=excluded.name, income=excluded.income, age=excluded.age,
         employmentType=excluded.employmentType, accountNumber=excluded.accountNumber`,
    )
    .run({
      applicantId,
      name: 'E2E Test Applicant',
      income: '5200.00',
      age: 34,
      employmentType: 'SALARIED',
      accountNumber: '4000000000009999',
    });
}

export async function insertOffer(applicationId: string, tenureMonths: number): Promise<void> {
  getDb()
    .prepare(
      `INSERT INTO offers (applicationId, rateBandLabel, annualRate, emi, tenureMonths, totalPayable)
       VALUES (@applicationId, @rateBandLabel, @annualRate, @emi, @tenureMonths, @totalPayable)
       ON CONFLICT(applicationId) DO UPDATE SET
         rateBandLabel=excluded.rateBandLabel, annualRate=excluded.annualRate, emi=excluded.emi,
         tenureMonths=excluded.tenureMonths, totalPayable=excluded.totalPayable`,
    )
    .run({
      applicationId,
      rateBandLabel: 'PRIME',
      annualRate: '0.10',
      emi: '351.66',
      tenureMonths,
      totalPayable: '4219.96',
    });
}
