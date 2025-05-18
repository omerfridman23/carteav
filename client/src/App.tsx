import { useState, useEffect } from 'react';
import './App.css';
import ScreeningButton from './components/ScreeningButton';
import Modal from './components/Modal';
import SeatsGrid from './components/SeatsGrid';
import { fetchScreenings, fetchOccupiedSeats, reserveSeats } from './services/api';
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

  const handleScreeningSelect = async (id: string) => {
    setSelectedScreening(id);
    setShowModal(true);
    setSelectedSeats([]);
    setReservationStatus(null);
    
    try {
      // Fetch occupied seats for this screening
      const seats = await fetchOccupiedSeats(id);
      setOccupiedSeats(seats);
    } catch (error) {
      console.error('Error fetching occupied seats:', error);
    }
  };

  const handleSeatClick = (seat: number) => {
    if (occupiedSeats.includes(seat)) return;
    setSelectedSeats(prev =>
      prev.includes(seat)
        ? prev.filter(s => s !== seat)
        : prev.length < 4
        ? [...prev, seat]
        : prev
    );
  };

  const handleReserve = async () => {
    if (!selectedScreening || selectedSeats.length === 0) return;
    
    try {
      setReservationStatus('pending');
      // Call API to reserve seats
      const response = await reserveSeats(selectedScreening, selectedSeats);
      
      if (response.success) {
        setReservationStatus('success');
        
        // Store reservation data (in a real app, you might want to save this in state)
        const orderId = response.orderId;
        const expiryTime = response.expiresAt ? new Date(response.expiresAt) : null;
        
        console.log(`Order ${orderId} created successfully`);
        console.log(`Seats will be reserved until ${expiryTime?.toLocaleTimeString()}`);
        
        // Add small delay to show success message before closing
        setTimeout(() => {
          setShowModal(false);
          setReservationStatus(null);
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to reserve seats:', error);
      setReservationStatus('error');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setReservationStatus(null);
  };

  const getScreeningTitle = () => {
    const screening = screenings.find(s => s.id === selectedScreening);
    if (screening) {
      return `${screening.movieTitle} at ${screening.time}`;
    }
    return 'Select Seats';
  };

  const renderReservationStatus = () => {
    if (!reservationStatus) return null;
    
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
      {selectedSeats.length > 0 && !reservationStatus && (
        <button className="reserve-button" onClick={handleReserve}>
          Reserve {selectedSeats.length} Seat{selectedSeats.length > 1 ? 's' : ''}
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
            <div className="legend-color legend-occupied"></div>
            <span>Occupied</span>
          </div>
        </div>
        
        {selectedSeats.length > 0 && (
          <p>Selected seats: {selectedSeats.sort((a, b) => a - b).join(', ')}</p>
        )}
        {selectedSeats.length === 4 && (
          <p>Maximum 4 seats can be selected at once.</p>
        )}
      </Modal>
    </div>
  );
}

export default App;
