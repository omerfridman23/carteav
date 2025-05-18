import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { Screening } from '../models/Screening';
import socketService from '../services/socketService';

/**
 * Order controller for handling order-related requests
 */
const orderController = {
  /**
   * Create a new reservation
   * @route POST /api/orders
   */
  createReservation: async (req: Request, res: Response) => {
    try {
      const { screeningId, seatNumbers } = req.body;

      if (!screeningId || !seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request data. Please provide screeningId and seatNumbers.'
        });
      }

      if (seatNumbers.length > 4) {
        return res.status(400).json({
          success: false,
          message: 'You cannot reserve more than 4 seats at a time.'
        });
      }

      // Convert string ID to ObjectId
      const screeningObjectId = new mongoose.Types.ObjectId(screeningId);

      // Find the screening
      const screening = await Screening.findById(screeningObjectId);
      if (!screening) {
        return res.status(404).json({
          success: false,
          message: 'Screening not found.'
        });
      }

      // Check if seats are available
      const occupiedSeats = screening.seats
        .filter(seat => seat.status !== 'available')
        .map(seat => seat.number);

      // Check if any of the requested seats are already occupied
      const unavailableSeats = seatNumbers.filter(seatNumber => 
        occupiedSeats.includes(seatNumber)
      );

      if (unavailableSeats.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Seats ${unavailableSeats.join(', ')} are not available.`
        });
      }

      // Calculate expiration time (15 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      // Create a temporary userId (in a real app, this would come from authentication)
      const tempUserId = new mongoose.Types.ObjectId();

      // Create the order
      const order = new Order({
        userId: tempUserId,
        screeningId: screeningObjectId,
        seatNumbers,
        status: 'pending',
        expiresAt
      });

      await order.save();      // Update seat status in the screening
      await Screening.updateOne(
        { _id: screeningObjectId },
        {
          $set: {
            'seats.$[elem].status': 'reserved',
            'seats.$[elem].reservedUntil': expiresAt,
            'seats.$[elem].orderId': order._id
          }
        },
        {
          arrayFilters: [{ 'elem.number': { $in: seatNumbers } }],
          multi: true
        }
      );

      // Notify connected clients about the seat update
      socketService.emitSeatsUpdated(screeningId);

      res.status(201).json({
        success: true,
        message: 'Seats reserved successfully.',
        data: {
          orderId: order._id,
          screeningId,
          seatNumbers,
          expiresAt
        }
      });
    } catch (error) {
      console.error('Error creating reservation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create reservation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  /**
   * Get order by ID
   * @route GET /api/orders/:id
   */
  getOrderById: async (req: Request, res: Response) => {
    try {
      const order = await Order.findById(req.params.id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch order',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
  
  /**
   * Confirm an order
   * @route PUT /api/orders/:id/confirm
   */
  confirmOrder: async (req: Request, res: Response) => {
    try {
      const order = await Order.findById(req.params.id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      if (order.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Order cannot be confirmed because it is ${order.status}`
        });
      }

      // Check if order is expired
      if (order.expiresAt < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Order has expired and cannot be confirmed'
        });
      }

      // Update order status
      order.status = 'confirmed';
      await order.save();      // Update seat status in the screening
      await Screening.updateOne(
        { _id: order.screeningId },
        {
          $set: {
            'seats.$[elem].status': 'booked',
            'seats.$[elem].reservedUntil': null
          }
        },
        {
          arrayFilters: [{ 'elem.orderId': order._id }],
          multi: true
        }
      );

      // Notify connected clients about the seat update
      socketService.emitSeatsUpdated(order.screeningId.toString());

      res.json({
        success: true,
        message: 'Order confirmed successfully',
        data: order
      });
    } catch (error) {
      console.error('Error confirming order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to confirm order',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  /**
   * Update an existing reservation with new seat selections
   * @route PUT /api/orders/:id
   */
  updateReservation: async (req: Request, res: Response) => {
    try {
      const orderId = req.params.id;
      const { seatNumbers } = req.body;

      if (!seatNumbers || !Array.isArray(seatNumbers)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request data. Please provide seatNumbers as an array.'
        });
      }

      if (seatNumbers.length > 4) {
        return res.status(400).json({
          success: false,
          message: 'You cannot reserve more than 4 seats at a time.'
        });
      }

      // Find the existing order
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found.'
        });
      }

      if (order.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Order cannot be updated because it is ${order.status}`
        });
      }      // Check if order is expired
      if (order.expiresAt < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Order has expired and cannot be updated'
        });
      }

      // Get the current screening
      const screening = await Screening.findById(order.screeningId);
      if (!screening) {
        return res.status(404).json({
          success: false,
          message: 'Screening not found.'
        });
      }

      try {
        // Get the current seats associated with this order
        const currentOrderSeats = screening.seats.filter(
          seat => seat.orderId?.toString() === orderId
        );
        
        // Get numbers of all occupied seats not belonging to this order
        const occupiedSeats = screening.seats
          .filter(seat => seat.status !== 'available' && 
                        (!seat.orderId || seat.orderId.toString() !== orderId))
          .map(seat => seat.number);
        
        // Check if any of the requested seats are already occupied by someone else
        const unavailableSeats = seatNumbers.filter(seatNumber => 
          occupiedSeats.includes(seatNumber)
        );

        if (unavailableSeats.length > 0) {
          throw new Error(`Seats ${unavailableSeats.join(', ')} are not available.`);
        }
        
        // Get seats to release (seats that were in the order but are no longer selected)
        const seatsToRelease = currentOrderSeats
          .filter(seat => !seatNumbers.includes(seat.number))
          .map(seat => seat.number);
          
        // Get new seats to reserve (seats that weren't in the order but are now selected)
        const seatsToReserve = seatNumbers.filter(
          seatNumber => !order.seatNumbers.includes(seatNumber)
        );
        
        // Release seats that are no longer selected
        if (seatsToRelease.length > 0) {
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
              arrayFilters: [{ 'elem.number': { $in: seatsToRelease } }],
              multi: true
            }
          );
        }
        
        // Reserve new seats
        if (seatsToReserve.length > 0) {
          await Screening.updateOne(
            { _id: order.screeningId },
            {
              $set: {
                'seats.$[elem].status': 'reserved',
                'seats.$[elem].reservedUntil': order.expiresAt,
                'seats.$[elem].orderId': order._id
              }
            },
            {
              arrayFilters: [{ 'elem.number': { $in: seatsToReserve } }],
              multi: true
            }
          );
        }
        
        // Update the order with the new seat numbers
        await Order.updateOne(
          { _id: orderId },
          { $set: { seatNumbers } }
        );
        
        // If all seats were removed, expire the order
        if (seatNumbers.length === 0) {
          await Order.updateOne(
            { _id: orderId },
            { $set: { status: 'expired' } }
          );
        }
        
        // Notify connected clients about the seat update
        socketService.emitSeatsUpdated(order.screeningId.toString());
        
        res.json({
          success: true,
          message: 'Reservation updated successfully.',
          data: {
            orderId,
            seatNumbers
          }
        });
        
      } catch (error) {
        // Handle errors
        console.error('Error updating reservation:', error);
        res.status(400).json({
          success: false,
          message: error instanceof Error ? error.message : 'Failed to update reservation',
        });
      }
      
    } catch (error) {
      console.error('Error updating reservation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update reservation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
};

export default orderController;