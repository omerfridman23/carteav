import { useState, useEffect, useCallback } from 'react';
import './App.css';
import ScreeningButton from './components/ScreeningButton';
import Modal from './components/Modal';
import SeatsGrid from './components/SeatsGrid';
import { fetchScreenings, fetchOccupiedSeats, reserveSeats, confirmReservation, updateReservation } from './services/api';
import socketService from './services/socket';
import type { Screening } from './services/api';

function App() {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedScreening, setSelectedScreening] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [occupiedSeats, setOccupiedSeats] = useState<number[]>([]);
  const [reservationStatus, setReservationStatus] = useState<string | null>(null);
  const [expiryTimer, setExpiryTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [expiryTime, setExpiryTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [orderId, setOrderId] = useState<string | null>(null);

  // Initialize socket connection when component mounts
  useEffect(() => {
    socketService.initializeSocket();
    
    return () => {
      socketService.cleanupSocket();
      if (expiryTimer) {
        clearInterval(expiryTimer);
      }
    };
  }, [expiryTimer]);

  // Fetch screenings when component mounts
  useEffect(() => {
    const getScreenings = async () => {
      try {
        setLoading(true);
        const data = await fetchScreenings();
        setScreenings(data);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch screenings:', error);
        setError('Failed to load screenings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    getScreenings();
  }, []);

  // Handle seat update events from socket server
  const handleSeatUpdates = useCallback((data: { screeningId: string }) => {
    if (selectedScreening === data.screeningId && showModal) {
      console.log(`Received seat updates for screening ${data.screeningId}`);
      
      // Refresh the occupied seats data
      fetchOccupiedSeats(data.screeningId)
        .then(seats => {
          setOccupiedSeats(seats);
          
          // Check if any of our selected seats are now occupied by someone else
          const newlyOccupied = selectedSeats.filter(seat => seats.includes(seat));
          if (newlyOccupied.length > 0) {
            setSelectedSeats(prev => prev.filter(seat => !seats.includes(seat)));
            setError(`Seats ${newlyOccupied.join(', ')} were just reserved by someone else.`);
            
            // Clear error message after 3 seconds
            setTimeout(() => setError(null), 3000);
          }
        })
        .catch(error => {
          console.error('Error refreshing seats:', error);
        });
    }
  }, [selectedScreening, showModal, selectedSeats]);

  // Subscribe to seat updates when the selected screening changes
  useEffect(() => {
    if (selectedScreening) {
      socketService.joinScreeningRoom(selectedScreening);
      socketService.subscribeToSeatUpdates(handleSeatUpdates);
    }
  }, [selectedScreening, handleSeatUpdates]);

  // Update the time remaining countdown
  useEffect(() => {
    if (expiryTime) {
      const timer = setInterval(() => {
        const now = new Date();
        const diff = expiryTime.getTime() - now.getTime();
        
        if (diff <= 0) {
          setTimeRemaining('Expired');
          clearInterval(timer);
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);
      
      setExpiryTimer(timer);
      
      return () => {
        clearInterval(timer);
      };
    }
  }, [expiryTime]);

  const handleScreeningSelect = async (id: string) => {
    setSelectedScreening(id);
    setShowModal(true);
    setSelectedSeats([]);
    setReservationStatus(null);
    setExpiryTime(null);
    setTimeRemaining('');
    setOrderId(null);
    
    if (expiryTimer) {
      clearInterval(expiryTimer);
      setExpiryTimer(null);
    }
    
    try {
      // Fetch occupied seats for this screening
      const seats = await fetchOccupiedSeats(id);
      setOccupiedSeats(seats);
    } catch (error) {
      console.error('Error fetching occupied seats:', error);
    }
  };

  const handleSeatClick = async (seat: number) => {
    // Don't allow clicking on occupied seats that aren't part of this reservation
    if (occupiedSeats.includes(seat) && !selectedSeats.includes(seat)) return;
    
    // If we already have an order, update it
    if (orderId && expiryTime) {
      try {
        setReservationStatus('pending');
        
        // Check if we're adding or removing a seat
        const updatedSeats = selectedSeats.includes(seat)
          ? selectedSeats.filter(s => s !== seat)
          : [...selectedSeats, seat];
        
        // Don't exceed 4 seats
        if (updatedSeats.length > 4) {
          setReservationStatus(null);
          return;
        }
        
        // Call API to update the reservation
        const response = await updateReservation(orderId, updatedSeats);
        
        if (response.success) {
          // Update the selected seats
          setSelectedSeats(updatedSeats);
          
          // Update occupied seats based on the changes
          if (selectedSeats.includes(seat)) {
            // We removed a seat
            setOccupiedSeats(prev => prev.filter(s => s !== seat));
          } else {
            // We added a seat
            setOccupiedSeats(prev => [...prev, seat]);
          }
          
          // If we removed all seats, reset the order
          if (updatedSeats.length === 0) {
            setOrderId(null);
            setExpiryTime(null);
            setTimeRemaining('');
          }
          
          setReservationStatus(null);
        } else {
          setReservationStatus('error');
        }
      } catch (error) {
        console.error('Failed to update seats:', error);
        setReservationStatus('error');
      }
    } else {
      // Otherwise just update the local selection
      setSelectedSeats(prev =>
        prev.includes(seat)
          ? prev.filter(s => s !== seat)
          : prev.length < 4
          ? [...prev, seat]
          : prev
      );
    }
  };

  const handleReserve = async () => {
    if (!selectedScreening || selectedSeats.length === 0) return;
    
    try {
      setReservationStatus('pending');
      // Call API to reserve seats
      const response = await reserveSeats(selectedScreening, selectedSeats);
      
      if (response.success) {
        setReservationStatus('success');
        
        // Store reservation data
        if (response.expiresAt) {
          const expiry = new Date(response.expiresAt);
          setExpiryTime(expiry);
          
          // Calculate initial time remaining
          const now = new Date();
          const diff = expiry.getTime() - now.getTime();
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
        
        // Store the order ID
        if (response.orderId) {
          setOrderId(response.orderId);
        }
        
        console.log(`Order ${response.orderId} created successfully`);
        console.log(`Seats will be reserved until ${response.expiresAt}`);
        
        // Update occupied seats to include newly reserved ones
        setOccupiedSeats(prev => [...prev, ...selectedSeats]);
        
        // Add small delay to show success message
        setTimeout(() => {
          setReservationStatus(null);
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to reserve seats:', error);
      setReservationStatus('error');
    }
  };

  const handleConfirmReservation = async () => {
    if (!orderId || !expiryTime) return;
    
    try {
      setReservationStatus('pending');
      // Call API to confirm the order
      const response = await confirmReservation(orderId);
      
      if (response.success) {
        setReservationStatus('success');
        setExpiryTime(null);
        setTimeRemaining('');
        
        // Show success message and close modal
        setTimeout(() => {
          setShowModal(false);
          setReservationStatus(null);
          setOrderId(null);
        }, 1500);
      } else {
        setReservationStatus('error');
      }
    } catch (error) {
      console.error('Failed to confirm reservation:', error);
      setReservationStatus('error');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setReservationStatus(null);
    setExpiryTime(null);
    setTimeRemaining('');
    setOrderId(null);
    
    if (expiryTimer) {
      clearInterval(expiryTimer);
      setExpiryTimer(null);
    }
  };

  const getScreeningTitle = () => {
    const screening = screenings.find(s => s.id === selectedScreening);
    if (screening) {
      return `${screening.movieTitle} at ${screening.time}`;
    }
    return 'Select Seats';
  };

  const renderReservationStatus = () => {
    if (!reservationStatus) {
      // Show timer if there's an expiry time but no reservation status
      if (expiryTime && timeRemaining) {
        return (
          <p className="reservation-status pending">
            <span className="countdown-icon">⏱️</span> Reservation expires in: {timeRemaining}
          </p>
        );
      }
      return null;
    }
    
    if (reservationStatus === 'pending') {
      return <p className="reservation-status pending">Processing your reservation...</p>;
    } else if (reservationStatus === 'success') {
      return <p className="reservation-status success">Seats reserved successfully!</p>;
    } else if (reservationStatus === 'error') {
      return <p className="reservation-status error">Failed to reserve seats. Please try again.</p>;
    }
  };

  const modalFooter = (
    <>
      {renderReservationStatus()}
      {selectedSeats.length > 0 && !reservationStatus && !expiryTime && (
        <button className="reserve-button" onClick={handleReserve}>
          Reserve {selectedSeats.length} Seat{selectedSeats.length > 1 ? 's' : ''}
        </button>
      )}
      {expiryTime && (
        <button className="reserve-button" onClick={handleConfirmReservation}>
          Confirm Reservation
        </button>
      )}
      <button className="close-button" onClick={closeModal}>
        Close
      </button>
    </>
  );

  return (
    <div className="App">
      <h1>Cinema Ticket Booking</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading ? (
        <p>Loading screenings...</p>
      ) : (
        <>
          <h2>Select a Screening Time</h2>
          <ul className="screening-list">
            {screenings.map(s => (
              <li key={s.id}>
                <ScreeningButton 
                  id={s.id} 
                  time={s.time} 
                  onSelect={handleScreeningSelect} 
                  title={s.movieTitle}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={getScreeningTitle()}
        footer={modalFooter}
      >
        <SeatsGrid
          totalSeats={50}
          occupiedSeats={occupiedSeats}
          selectedSeats={selectedSeats}
          onSeatClick={handleSeatClick}
          reservedByMe={!!expiryTime}
        />
        
        <div className="seat-legend">
          <div className="legend-item">
            <div className="legend-color legend-available"></div>
            <span>Available</span>
          </div>
          <div className="legend-item">
            <div className="legend-color legend-selected"></div>
            <span>Selected</span>
          </div>
          <div className="legend-item">
            <div className="legend-color legend-reserved"></div>
            <span>Your Reservation</span>
          </div>
          <div className="legend-item">
            <div className="legend-color legend-occupied"></div>
            <span>Occupied</span>
          </div>
        </div>
        
        {selectedSeats.length > 0 && !expiryTime && (
          <p>Selected seats: {selectedSeats.sort((a, b) => a - b).join(', ')}</p>
        )}
        {expiryTime && (
          <p>Reserved seats: {selectedSeats.sort((a, b) => a - b).join(', ')}</p>
        )}
        {selectedSeats.length === 4 && (
          <p>Maximum 4 seats can be selected at once.</p>
        )}
      </Modal>
    </div>
  );
}

export default App;
