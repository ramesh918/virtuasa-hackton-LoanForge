import { DataSource } from 'typeorm';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
// Imports the *built* entities, not the TS source — TypeORM's decorators need a real tsc compile
// (experimentalDecorators), which Node's --experimental-strip-types does not perform. `npm run
// seed` runs `nest build` first for exactly this reason.
import { Application } from '../src/api/dist/modules/intake/entity/application.entity.js';
import { Applicant } from '../src/api/dist/modules/eligibility/entity/applicant.entity.js';
import { Offer } from '../src/api/dist/modules/pricing/entity/offer.entity.js';
import { DecisionRecord } from '../src/api/dist/modules/underwriting/entity/decision-record.entity.js';
import { DisbursementRecord } from '../src/api/dist/modules/disbursement/entity/disbursement-record.entity.js';

// Anchored to this file's own location, not process.cwd() — must resolve to the exact same file
// app.module.ts's DEFAULT_SQLITE_PATH does, regardless of which directory `npm run seed` is
// invoked from (see the identical comment there for the bug this fixes).
const DEFAULT_SQLITE_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../src/api/loanforge.sqlite');
const SQLITE_DB_PATH = process.env.SQLITE_DB_PATH ?? DEFAULT_SQLITE_PATH;

const syntheticApplicants = [
  {
    applicantId: 'APP-0001',
    name: 'Jordan Rivera',
    income: '5200.00',
    age: 34,
    employmentType: 'SALARIED',
    accountNumber: '4000123456781234',
  },
  {
    applicantId: 'APP-0002',
    name: 'Sam Okafor',
    income: '3100.00',
    age: 22,
    employmentType: 'SELF_EMPLOYED',
    accountNumber: '4000123456782345',
  },
  {
    applicantId: 'APP-0003',
    name: 'Priya Nandan',
    income: '7800.00',
    age: 45,
    employmentType: 'SALARIED',
    accountNumber: '4000123456783456',
  },
];

const syntheticProducts = [
  { productId: 'PRD-PERSONAL', name: 'Personal Loan', minAmount: '1000.00', maxAmount: '25000.00' },
  { productId: 'PRD-AUTO', name: 'Auto Loan', minAmount: '5000.00', maxAmount: '60000.00' },
];

async function seed() {
  // Uses TypeORM's own DataSource (synchronize: true) so it creates tables itself if this is the
  // very first run — seeding never has to happen after the API has booted at least once.
  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: SQLITE_DB_PATH,
    entities: [Application, Applicant, Offer, DecisionRecord, DisbursementRecord],
    synchronize: true,
  });
  await dataSource.initialize();

  const applicantRepo = dataSource.getRepository(Applicant);
  await applicantRepo.clear();
  await applicantRepo.save(syntheticApplicants);

  await dataSource.destroy();

  // Products aren't wired into any current business rule (intake's productId is a free-text
  // field) — kept as a lightweight reference table via a raw connection, matching prior scope.
  const raw = new Database(SQLITE_DB_PATH);
  raw.exec(
    'CREATE TABLE IF NOT EXISTS products (productId TEXT PRIMARY KEY, name TEXT, minAmount TEXT, maxAmount TEXT)',
  );
  raw.exec('DELETE FROM products');
  const insertProduct = raw.prepare(
    'INSERT INTO products (productId, name, minAmount, maxAmount) VALUES (?, ?, ?, ?)',
  );
  for (const product of syntheticProducts) {
    insertProduct.run(product.productId, product.name, product.minAmount, product.maxAmount);
  }
  raw.close();

  console.log(
    `Seeded ${syntheticApplicants.length} applicants and ${syntheticProducts.length} products into ${SQLITE_DB_PATH}`,
  );
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
