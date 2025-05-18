import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import routes from './routes';
import seedScreenings from './seeders/screeningSeeder';
import socketService from './services/socketService';
import cronService from './services/cronService';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server using Express app
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "";

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');
    
    // Seed the database with initial data
    try {
      await seedScreenings();
    } catch (error) {
      console.error('Error seeding database:', error);
    }
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// API Routes
app.use('/api', routes);

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.json({
    message: 'API is working correctly!',
    timestamp: new Date().toISOString()
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize Socket.io service
  socketService.initialize(server);
  
  // Initialize Cron service to handle order expiration
  cronService.initialize();
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('\nStarting graceful shutdown...');
  
  // Stop cron jobs
  cronService.stop();
  
  // Close server
  server.close(() => {
    console.log('HTTP server closed');
      // Close database connection
    mongoose.connection.close().then(() => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
};

// Handle termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default app;
