import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'offers' })
export class Offer {
  @PrimaryColumn()
  applicationId!: string;

  @Column()
  rateBandLabel!: string;

  /** Fixed-point decimal string (NFR-01) — never a native number. */
  @Column()
  annualRate!: string;

  /** Fixed-point decimal string (NFR-01) — never a native number. */
  @Column()
  emi!: string;

  @Column()
  tenureMonths!: number;

  /** Fixed-point decimal string (NFR-01) — never a native number. */
  @Column()
  totalPayable!: string;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
