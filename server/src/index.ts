import express, { Request, Response } from 'express';
import mongoose, { Schema, Document } from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define Test Item interface
interface ITestItem extends Document {
  name: string;
  value: number;
}

// Create schema for test collection
const TestItemSchema = new Schema<ITestItem>({
  name: { type: String, required: true },
  value: { type: Number, required: true }
});

// Create model
const TestItem = mongoose.model<ITestItem>('TestItem', TestItemSchema, 'test');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Test route
app.get('/api/test', async (req: Request, res: Response) => {
  try {
    // Find all items in the test collection
    const items = await TestItem.find().exec();
    
    res.json({
      message: 'API is working correctly!',
      timestamp: new Date().toISOString(),
      data: {
        items,
        count: items.length
      }
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ 
      message: 'Failed to fetch data from database',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
