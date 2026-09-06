import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OfferDocument = HydratedDocument<Offer>;

@Schema({ timestamps: true, collection: 'offers' })
export class Offer {
  @Prop({ required: true, unique: true })
  applicationId!: string;

  @Prop({ required: true })
  rateBandLabel!: string;

  /** Fixed-point decimal string (NFR-01) — never a native number. */
  @Prop({ required: true })
  annualRate!: string;

  /** Fixed-point decimal string (NFR-01) — never a native number. */
  @Prop({ required: true })
  emi!: string;

  @Prop({ required: true })
  tenureMonths!: number;

  /** Fixed-point decimal string (NFR-01) — never a native number. */
  @Prop({ required: true })
  totalPayable!: string;
}

export const OfferSchema = SchemaFactory.createForClass(Offer);
