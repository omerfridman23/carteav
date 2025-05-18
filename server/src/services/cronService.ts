import schedule from 'node-schedule';
import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { Screening } from '../models/Screening';
import socketService from './socketService';

/**
 * Cron service to handle scheduled tasks like expiring orders
 */
export class CronService {
  private static instance: CronService;
  private expirationJob: schedule.Job | null = null;

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): CronService {
    if (!CronService.instance) {
      CronService.instance = new CronService();
    }
    return CronService.instance;
  }

  /**
   * Initialize the cron service
   */
  public initialize(): void {
    // Start the order expiration job to run every minute
    this.expirationJob = schedule.scheduleJob('*/1 * * * *', async () => {
      await this.expireOrders();
    });
    
    console.log('Cron service initialized - Order expiration job scheduled');
  }

  /**
   * Expire orders that have passed their expiration time
   */
  private async expireOrders(): Promise<void> {
    console.log('Running order expiration job...');
    
    const now = new Date();
    
    try {
      // Find all pending orders that have expired
      const expiredOrders = await Order.find({
        status: 'pending',
        expiresAt: { $lt: now }
      });
      
      if (expiredOrders.length === 0) {
        console.log('No expired orders found');
        return;
      }
      
      console.log(`Found ${expiredOrders.length} expired orders`);
      
      // Process each expired order
      const screeningUpdates = new Map<string, boolean>();
      
      for (const order of expiredOrders) {
        // Update order status to expired
        await Order.updateOne(
          { _id: order._id },
          { $set: { status: 'expired' } }
        );
        
        // Free up the reserved seats
        await Screening.updateOne(
          { _id: order.screeningId },
          {
            $set: {
              'seats.$[elem].status': 'available',
              'seats.$[elem].reservedUntil': null,
              'seats.$[elem].orderId': null
            }
          },
          {
            arrayFilters: [{ 'elem.orderId': order._id }],
            multi: true
          }
        );
        
        // Track which screenings need to be updated
        screeningUpdates.set(order.screeningId.toString(), true);
        
        console.log(`Expired order ${order._id} for screening ${order.screeningId}`);
      }
      
      // After processing, notify connected clients
      screeningUpdates.forEach((_, screeningId) => {
        socketService.emitSeatsUpdated(screeningId);
      });
      
    } catch (error: any) {
      console.error('Error in order expiration job:', error);
    }
  }

  /**
   * Stop all running jobs
   */
  public stop(): void {
    if (this.expirationJob) {
      this.expirationJob.cancel();
      console.log('Order expiration job stopped');
    }
  }
}

export default CronService.getInstance();