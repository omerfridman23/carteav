import express, { Request, Response } from 'express';
import screeningsRoutes from './screenings';
import ordersRoutes from './orders';

const router = express.Router();

// Root route
router.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Cinema Booking API',
    version: '1.0.0',
    endpoints: [
      '/api/screenings - Get all screenings',
      '/api/screenings/:id - Get a specific screening',
      '/api/screenings/:id/seats - Get occupied seats for a screening',
      '/api/orders - Create a new reservation',
      '/api/orders/:id - Get a specific order',
      '/api/orders/:id/confirm - Confirm an order'
    ]
  });
});

// Register all routes
router.use('/screenings', screeningsRoutes);
router.use('/orders', ordersRoutes);

export default router;
