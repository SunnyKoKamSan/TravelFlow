import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  tripId: string;
  userId: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  splits: {
    userId: string;
    amount: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    tripId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true },
    category: { type: String, default: 'other' },
    splits: [
      {
        userId: String,
        amount: Number,
      },
    ],
  },
  { timestamps: true }
);

expenseSchema.index({ tripId: 1, userId: 1 });

export const Expense = mongoose.model<IExpense>('Expense', expenseSchema);
