import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * The applicant's standing profile (seeded synthetic data) — distinct from the per-application
 * snapshot captured at intake. Holds attributes like age that aren't submitted with every application.
 */
@Entity({ name: 'applicants' })
export class Applicant {
  @PrimaryColumn()
  applicantId!: string;

  @Column()
  name!: string;

  @Column()
  income!: string;

  @Column()
  age!: number;

  @Column()
  employmentType!: string;

  /** Synthetic payout destination — masked before it is ever logged or persisted elsewhere (NFR-03). */
  @Column()
  accountNumber!: string;
}
