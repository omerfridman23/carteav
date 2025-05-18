import express, { Request, Response } from 'express';
import orderController from '../controllers/orderController';

const router = express.Router();

// Create a new reservation
router.post('/', (req: Request, res: Response) => {
  orderController.createReservation(req, res);
});

// Update an existing reservation
router.put('/:id', (req: Request, res: Response) => {
  orderController.updateReservation(req, res);
});

// Get order by ID
router.get('/:id', (req: Request, res: Response) => {
  orderController.getOrderById(req, res);
});

// Confirm an order
router.put('/:id/confirm', (req: Request, res: Response) => {
  orderController.confirmOrder(req, res);
});

export default router;
