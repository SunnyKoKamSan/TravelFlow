import mongoose, { Schema, Document } from 'mongoose';

export interface ITrip extends Document {
  userId: string;
  destination: string;
  startDate: Date;
  days: number;
  createdAt: Date;
  updatedAt: Date;
  settings: {
    currencyCode: string;
    currencySymbol: string;
    targetLang: string;
    langName: string;
  };
}

const tripSchema = new Schema<ITrip>(
  {
    userId: { type: String, required: true, index: true },
    destination: { type: String, required: true },
    startDate: { type: Date, required: true },
    days: { type: Number, required: true, min: 1, max: 365 },
    settings: {
      currencyCode: { type: String, default: 'USD' },
      currencySymbol: { type: String, default: '$' },
      targetLang: { type: String, default: 'en' },
      langName: { type: String, default: 'English' },
    },
  },
  { timestamps: true }
);

export const Trip = mongoose.model<ITrip>('Trip', tripSchema);
