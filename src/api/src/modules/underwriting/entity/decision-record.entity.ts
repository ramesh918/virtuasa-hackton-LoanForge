import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export const Decision = {
  APPROVE: 'APPROVE',
  DECLINE: 'DECLINE',
  REQUEST_INFO: 'REQUEST_INFO',
} as const;

export type Decision = (typeof Decision)[keyof typeof Decision];

/** AC-07, NFR-02: append-only — no update/delete method is exposed anywhere in this module. */
@Entity({ name: 'decisions' })
export class DecisionRecord {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  applicationId!: string;

  @Column()
  actor!: string;

  // Explicit `type: 'text'` — see application.entity.ts's comment on the same const/type name
  // collision risk with bare @Column() + emitDecoratorMetadata.
  @Column({ type: 'text' })
  decision!: Decision;

  @Column()
  reason!: string;

  @CreateDateColumn()
  timestamp!: Date;
}
