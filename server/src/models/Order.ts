import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  screeningId: mongoose.Types.ObjectId;
  seatNumbers: number[];
  status: 'pending' | 'confirmed' | 'expired';
  reservedAt: Date;
  expiresAt: Date;
}

const OrderSchema = new Schema<IOrder>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  screeningId: { type: Schema.Types.ObjectId, ref: 'Screening', required: true },
  seatNumbers: [{ type: Number, required: true }],
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'expired'],
    default: 'pending',
    required: true
  },
  reservedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, { timestamps: true });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
