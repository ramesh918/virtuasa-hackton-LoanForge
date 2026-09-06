import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApplicationState } from '../../../domain/application-state.js';

export type ApplicationDocument = HydratedDocument<Application>;

@Schema({ timestamps: true, collection: 'applications' })
export class Application {
  @Prop({ required: true, unique: true })
  applicationId!: string;

  @Prop({ required: true })
  applicantId!: string;

  @Prop({ required: true })
  productId!: string;

  /** Fixed-point decimal string (NFR-01) — never a native number. */
  @Prop({ required: true })
  amount!: string;

  @Prop({ required: true })
  tenureMonths!: number;

  @Prop({ required: true })
  purpose!: string;

  /** Fixed-point decimal string (NFR-01) — never a native number. */
  @Prop({ required: true })
  income!: string;

  @Prop({ required: true })
  employmentType!: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(ApplicationState),
    default: ApplicationState.SUBMITTED,
  })
  state!: ApplicationState;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);
