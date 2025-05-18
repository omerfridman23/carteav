import express, { Request, Response } from 'express';
import screeningController from '../controllers/screeningController';

const router = express.Router();

// GET all screenings
router.get('/', (req: Request, res: Response) => {
  screeningController.getAllScreenings(req, res);
});

// GET a single screening by ID
router.get('/:id', (req: Request, res: Response) => {
  screeningController.getScreeningById(req, res);
});

// GET occupied seats for a screening
router.get('/:id/seats', (req: Request, res: Response) => {
  screeningController.getOccupiedSeats(req, res);
});

export default router;
