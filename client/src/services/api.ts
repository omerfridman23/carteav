/**
 * API service for interacting with the backend
 */

// Define base URL for API requests
const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Interface for Screening data
 */
export interface Screening {
  id: string;
  movieTitle: string;
  time: string;
}

/**
 * Interface for Seat data
 */
export interface Seat {
  number: number;
  status: 'available' | 'reserved' | 'booked';
  reservedUntil?: string | null;
}

/**
 * Fetch all screenings from the API
 */
export const fetchScreenings = async (): Promise<Screening[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/screenings`);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching screenings:', error);
    throw error;
  }
};

/**
 * Fetch a specific screening by ID
 */
export const fetchScreeningById = async (id: string): Promise<Screening> => {
  try {
    const response = await fetch(`${API_BASE_URL}/screenings/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Error fetching screening ${id}:`, error);
    throw error;
  }
};

/**
 * Fetch occupied seats for a screening
 */
export const fetchOccupiedSeats = async (screeningId: string): Promise<number[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/screenings/${screeningId}/seats`);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const data = await response.json();
    // Extract just the seat numbers from the response
    return data.data.map((seat: Seat) => seat.number);
  } catch (error) {
    console.error(`Error fetching occupied seats for screening ${screeningId}:`, error);
    throw error;
  }
};

/**
 * Reserve seats for a screening
 */
export const reserveSeats = async (
  screeningId: string,
  seatNumbers: number[]
): Promise<{ success: boolean; orderId?: string; expiresAt?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        screeningId,
        seatNumbers,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error ${response.status}`);
    }
    
    return { 
      success: data.success,
      orderId: data.data?.orderId,
      expiresAt: data.data?.expiresAt
    };
  } catch (error) {
    console.error('Error reserving seats:', error);
    throw error;
  }
};

/**
 * Confirm a reservation
 */
export const confirmReservation = async (orderId: string): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/confirm`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error ${response.status}`);
    }
    
    return { success: data.success };
  } catch (error) {
    console.error('Error confirming reservation:', error);
    throw error;
  }
};

/**
 * Update a reservation
 */
export const updateReservation = async (
  orderId: string,
  seatNumbers: number[]
): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        seatNumbers,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error ${response.status}`);
    }
    
    return { success: data.success };
  } catch (error) {
    console.error('Error updating reservation:', error);
    throw error;
  }
};

export default {
  fetchScreenings,
  fetchScreeningById,
  fetchOccupiedSeats,
  reserveSeats,
  confirmReservation,
  updateReservation
};
