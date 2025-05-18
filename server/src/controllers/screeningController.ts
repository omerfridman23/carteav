import { Request, Response } from 'express';
import { Screening } from '../models/Screening';

/**
 * Format date to display only hours and minutes (HH:MM)
 */
const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Screening controller for handling screening-related requests
 */
const screeningController = {
  /**
   * Get all screenings
   * @route GET /api/screenings
   */  getAllScreenings: async (req: Request, res: Response) => {
    try {
      const screenings = await Screening.find().sort({ time: 1 });
      res.json({
        success: true,
        data: screenings.map(screening => ({
          id: screening._id,
          movieTitle: screening.movieTitle,
          time: formatTime(screening.time)
        }))
      });
    } catch (error) {
      console.error('Error fetching screenings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch screenings',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  /**
   * Get screening by id
   * @route GET /api/screenings/:id
   */
  getScreeningById: async (req: Request, res: Response) => {
    try {
      const screening = await Screening.findById(req.params.id);
      
      if (!screening) {
        return res.status(404).json({
          success: false,
          message: 'Screening not found'
        });
      }      res.json({
        success: true,
        data: {
          id: screening._id,
          movieTitle: screening.movieTitle,
          time: formatTime(screening.time)
        }
      });
    } catch (error) {
      console.error('Error fetching screening:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch screening',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  /**
   * Get occupied seats for a screening
   * @route GET /api/screenings/:id/seats
   */
  getOccupiedSeats: async (req: Request, res: Response) => {
    try {
      const screening = await Screening.findById(req.params.id);
      
      if (!screening) {
        return res.status(404).json({
          success: false,
          message: 'Screening not found'
        });
      }

      // Filter seats that are not available
      const occupiedSeats = screening.seats
        .filter(seat => seat.status !== 'available')
        .map(seat => ({
          number: seat.number,
          status: seat.status,
          reservedUntil: seat.reservedUntil
        }));

      res.json({
        success: true,
        data: occupiedSeats
      });
    } catch (error) {
      console.error('Error fetching occupied seats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch occupied seats',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};

export default screeningController;