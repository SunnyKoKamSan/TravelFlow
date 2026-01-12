import mongoose, { Schema, Document } from 'mongoose';

export interface IItinerary extends Document {
  tripId: string;
  dayIndex: number;
  time: string;
  location: string;
  note: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const itinerarySchema = new Schema<IItinerary>(
  {
    tripId: { type: String, required: true, index: true },
    dayIndex: { type: Number, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true },
    note: { type: String, required: true },
    coordinates: {
      lat: Number,
      lon: Number,
    },
  },
  { timestamps: true }
);

// Index for efficient querying
itinerarySchema.index({ tripId: 1, dayIndex: 1 });

export const Itinerary = mongoose.model<IItinerary>('Itinerary', itinerarySchema);
