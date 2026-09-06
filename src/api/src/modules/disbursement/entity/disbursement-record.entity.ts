import { Column, Entity, PrimaryColumn } from 'typeorm';

/** AC-08, NFR-02: append-only — no update/delete method is exposed anywhere in this module. */
@Entity({ name: 'disbursements' })
export class DisbursementRecord {
  @PrimaryColumn()
  applicationId!: string;

  /** Fixed-point decimal string (NFR-01) — never a native number. */
  @Column()
  amount!: string;

  @Column()
  tenureMonths!: number;

  /** Masked before it ever reaches this record — the raw account number is never persisted (NFR-03). */
  @Column()
  maskedAccountReference!: string;

  @Column()
  payoutReference!: string;

  @Column()
  disbursedAt!: Date;
}
