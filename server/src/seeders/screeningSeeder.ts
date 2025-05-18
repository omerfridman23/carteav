import mongoose from 'mongoose';
import { Screening } from '../models/Screening';

/**
 * Seed the screenings collection with sample data
 */
export const seedScreenings = async (): Promise<void> => {
  try {
    // Check if screenings already exist
    const count = await Screening.countDocuments();
    
    if (count > 0) {
      console.log('Screenings collection already has data, skipping seeding');
      return;
    }

    // Movie titles for screenings
    const movies = [
      'The Dark Knight',
      'Inception',
      'The Matrix',
      'Interstellar'
    ];

    // Create today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate screenings for the next 7 days
    const screenings = [];
    
    for (let day = 0; day < 7; day++) {
      const date = new Date(today);
      date.setDate(today.getDate() + day);
      
      // Create 4 screenings per day at different times
      const times = [10, 13, 16, 19]; // Hours: 10 AM, 1 PM, 4 PM, 7 PM
      
      for (let i = 0; i < times.length; i++) {
        const movieIndex = (day + i) % movies.length;
        const screeningTime = new Date(date);
        screeningTime.setHours(times[i], 0, 0, 0);
        
        screenings.push({
          movieTitle: movies[movieIndex],
          time: screeningTime
        });
      }
    }

    // Create all screenings with seats
    const promises = screenings.map(screening => 
      Screening.createWithSeats(screening.movieTitle, screening.time)
    );
    
    await Promise.all(promises);
    
    console.log(`Successfully seeded ${screenings.length} screenings`);
  } catch (error) {
    console.error('Error seeding screenings:', error);
    throw error;
  }
};

export default seedScreenings;
