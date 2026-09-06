import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DecisionRecordDocument = HydratedDocument<DecisionRecord>;

export const Decision = {
  APPROVE: 'APPROVE',
  DECLINE: 'DECLINE',
  REQUEST_INFO: 'REQUEST_INFO',
} as const;

export type Decision = (typeof Decision)[keyof typeof Decision];

/** AC-07, NFR-02: append-only — no update/delete method is exposed anywhere in this module. */
@Schema({ collection: 'decisions' })
export class DecisionRecord {
  @Prop({ required: true })
  applicationId!: string;

  @Prop({ required: true })
  actor!: string;

  @Prop({ type: String, required: true, enum: Object.values(Decision) })
  decision!: Decision;

  @Prop({ required: true })
  reason!: string;

  @Prop({ required: true })
  timestamp!: Date;
}

export const DecisionRecordSchema = SchemaFactory.createForClass(DecisionRecord);
