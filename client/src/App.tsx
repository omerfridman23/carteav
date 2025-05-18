import { useState } from 'react';
import './App.css';
import ScreeningButton from './components/ScreeningButton';
import Modal from './components/Modal';
import SeatsGrid from './components/SeatsGrid';

const screenings = [
  { id: '1', time: '10:00 AM' },
  { id: '2', time: '1:00 PM' },
  { id: '3', time: '4:00 PM' },
  { id: '4', time: '7:00 PM' },
];

function App() {
  const [selectedScreening, setSelectedScreening] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  // Dummy occupied seats; replace with real fetch in production
  const occupiedSeats = [5, 12, 18, 25, 37, 42];

  const handleScreeningSelect = (id: string) => {
    setSelectedScreening(id);
    setShowModal(true);
    setSelectedSeats([]);
    // In a real app, would fetch occupied seats for this screening
    // fetchOccupiedSeats(id).then(seats => setOccupiedSeats(seats));
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

  const handleReserve = () => {
    // TODO: send reservation to backend
    // In a real app, would call something like:
    // reserveSeats(selectedScreening, selectedSeats).then(response => {
    //   if (response.success) {
    //     alert('Seats reserved successfully!');
    //     setShowModal(false);
    //   }
    // });
    alert(`Reserving seats: ${selectedSeats.join(', ')}`);
    setShowModal(false);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const screeningTitle = screenings.find(s => s.id === selectedScreening)?.time
    ? `Screening at ${screenings.find(s => s.id === selectedScreening)?.time}`
    : 'Select Seats';

  const modalFooter = (
    <>
      {selectedSeats.length > 0 && (
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
      <h2>Select a Screening Time</h2>
      <ul className="screening-list">
        {screenings.map(s => (
          <li key={s.id}>
            <ScreeningButton 
              id={s.id} 
              time={s.time} 
              onSelect={handleScreeningSelect} 
            />
          </li>
        ))}
      </ul>

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={screeningTitle}
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
