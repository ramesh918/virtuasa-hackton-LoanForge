import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ApplicantDocument = HydratedDocument<Applicant>;

/**
 * The applicant's standing profile (seeded synthetic data) — distinct from the per-application
 * snapshot captured at intake. Holds attributes like age that aren't submitted with every application.
 */
@Schema({ collection: 'applicants' })
export class Applicant {
  @Prop({ required: true, unique: true })
  applicantId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  income!: string;

  @Prop({ required: true })
  age!: number;

  @Prop({ required: true })
  employmentType!: string;

  /** Synthetic payout destination — masked before it is ever logged or persisted elsewhere (NFR-03). */
  @Prop({ required: true })
  accountNumber!: string;
}

export const ApplicantSchema = SchemaFactory.createForClass(Applicant);
