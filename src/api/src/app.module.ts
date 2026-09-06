import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { IntakeModule } from './modules/intake/intake.module.js';
import { EligibilityModule } from './modules/eligibility/eligibility.module.js';
import { PricingModule } from './modules/pricing/pricing.module.js';
import { UnderwritingModule } from './modules/underwriting/underwriting.module.js';
import { DisbursementModule } from './modules/disbursement/disbursement.module.js';
import { Application } from './modules/intake/entity/application.entity.js';
import { Applicant } from './modules/eligibility/entity/applicant.entity.js';
import { Offer } from './modules/pricing/entity/offer.entity.js';
import { DecisionRecord } from './modules/underwriting/entity/decision-record.entity.js';
import { DisbursementRecord } from './modules/disbursement/entity/disbursement-record.entity.js';

// Anchored to this file's own location (src/api/src/ or the compiled src/api/dist/, same depth
// either way) rather than process.cwd() — npm workspace scripts run with cwd set to the workspace
// directory (src/api/), so a bare relative path here would silently resolve to a *different* file
// than the one scripts/seed.ts (invoked from the repo root) writes to.
const DEFAULT_SQLITE_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../loanforge.sqlite');

@Module({
  imports: [
    // A single SQLite file — no external database server or Docker required. `synchronize: true`
    // is fine for this hackathon's scope (no migrations); it would be replaced by real migrations
    // for a production deployment.
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.SQLITE_DB_PATH ?? DEFAULT_SQLITE_PATH,
      entities: [Application, Applicant, Offer, DecisionRecord, DisbursementRecord],
      synchronize: true,
    }),
    IntakeModule,
    EligibilityModule,
    PricingModule,
    UnderwritingModule,
    DisbursementModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
