import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DisbursementRecordDocument = HydratedDocument<DisbursementRecord>;

/** AC-08, NFR-02: append-only — no update/delete method is exposed anywhere in this module. */
@Schema({ timestamps: true, collection: 'disbursements' })
export class DisbursementRecord {
  @Prop({ required: true, unique: true })
  applicationId!: string;

  /** Fixed-point decimal string (NFR-01) — never a native number. */
  @Prop({ required: true })
  amount!: string;

  @Prop({ required: true })
  tenureMonths!: number;

  /** Masked before it ever reaches this record — the raw account number is never persisted (NFR-03). */
  @Prop({ required: true })
  maskedAccountReference!: string;

  @Prop({ required: true })
  payoutReference!: string;

  @Prop({ required: true })
  disbursedAt!: Date;
}

export const DisbursementRecordSchema = SchemaFactory.createForClass(DisbursementRecord);
