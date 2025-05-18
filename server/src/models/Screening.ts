import mongoose, { Schema, Document, Model } from 'mongoose';

export type SeatStatus = 'available' | 'reserved' | 'booked';

export interface ISeat {
  number: number;
  status: SeatStatus;
  reservedUntil?: Date | null;
  orderId?: mongoose.Types.ObjectId | null;
}

export interface IScreening extends Document {
  movieTitle: string;
  time: Date;
  seats: ISeat[];
  createdAt: Date;
  updatedAt: Date;
}

interface ScreeningModel extends Model<IScreening> {
  createWithSeats(movieTitle: string, time: Date): Promise<IScreening>;
}

const SeatSchema = new Schema<ISeat>({
  number: { type: Number, required: true },
  status: {
    type: String,
    enum: ['available', 'reserved', 'booked'],
    default: 'available',
    required: true
  },
  reservedUntil: { type: Date, default: null },
  orderId: { type: mongoose.Types.ObjectId, ref: 'Order', default: null }
});

const ScreeningSchema = new Schema<IScreening>({
  movieTitle: { type: String, required: true },
  time: { type: Date, required: true },
  seats: { type: [SeatSchema], default: [] }
}, { timestamps: true });

// Static method to initialize a screening with 50 seats
ScreeningSchema.statics.createWithSeats = async function (
  movieTitle: string,
  time: Date
): Promise<IScreening> {
  const seats: ISeat[] = Array.from({ length: 50 }, (_, i) => ({
    number: i + 1,
    status: 'available'
  }));

  return this.create({ movieTitle, time, seats });
};

export const Screening = mongoose.model<IScreening, ScreeningModel>('Screening', ScreeningSchema);
