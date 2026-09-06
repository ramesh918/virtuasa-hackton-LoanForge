import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { ApplicationState } from '../../../domain/application-state.js';

@Entity({ name: 'applications' })
export class Application {
  @PrimaryColumn()
  applicationId!: string;

  @Column()
  applicantId!: string;

  @Column()
  productId!: string;

  /** Fixed-point decimal string (NFR-01) — never a native number. */
  @Column()
  amount!: string;

  @Column()
  tenureMonths!: number;

  @Column()
  purpose!: string;

  /** Fixed-point decimal string (NFR-01) — never a native number. */
  @Column()
  income!: string;

  @Column()
  employmentType!: string;

  // Explicit `type: 'text'` — a bare @Column() would reflect this property's TS type via
  // emitDecoratorMetadata, and ApplicationState's const+type name collision resolves to the const
  // object at runtime, not a string type. See docs/fix-loops/mongoose-schema-enum-type-collision.md
  // for the identical failure this avoided under Mongoose; TypeORM is equally susceptible.
  @Column({ type: 'text' })
  state!: ApplicationState;

  // Optional (not `!`) because TypeORM populates these on insert — code constructing a new
  // Application before it's persisted never sets them itself.
  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
