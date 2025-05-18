import mongoose from 'mongoose';
import { Screening } from '../models/Screening';

/**
 * Seed the screenings collection with sample data
 */
export const seedScreenings = async (): Promise<void> => {  try {
    // Check if screenings already exist
    const count = await Screening.countDocuments();
    
    if (count > 0) {
      console.log('Dropping existing screenings collection and reseeding...');
      await Screening.deleteMany({});
    }
    
    // Movie titles for screenings
    const movies = [
      'The Dark Knight',
      'Inception',
      'The Matrix',
      'Interstellar',
      'Pulp Fiction',
      'The Godfather',
      'Forrest Gump'
    ];

    // Create today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate screenings for the next 7 days
    const screenings = [];
    
    // Define screening times with no overlaps 
    // Only 3 screenings per day at different times
    const timeSlots = [
      { hour: 10, minute: 30 }, // 10:30 AM
      { hour: 14, minute: 15 }, // 2:15 PM
      { hour: 19, minute: 0 }   // 7:00 PM
    ];
    
    for (let day = 0; day < 7; day++) {
      const date = new Date(today);
      date.setDate(today.getDate() + day);
      
      // Assign a different movie to each time slot
      for (let i = 0; i < timeSlots.length; i++) {
        const movieIndex = (day * timeSlots.length + i) % movies.length;
        const screeningTime = new Date(date);
        screeningTime.setHours(timeSlots[i].hour, timeSlots[i].minute, 0, 0);
        
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
