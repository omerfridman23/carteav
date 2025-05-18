import React from 'react';
import Seat from './Seat';
import '../styles/components.css';

interface SeatsGridProps {
  totalSeats: number;
  occupiedSeats: number[];
  selectedSeats: number[];
  onSeatClick: (seat: number) => void;
}

const SeatsGrid: React.FC<SeatsGridProps> = ({ 
  totalSeats, 
  occupiedSeats, 
  selectedSeats, 
  onSeatClick 
}) => {
  return (
    <div className="seats-container">
      <div className="screen">
        <div className="screen-text">SCREEN</div>
      </div>
      <div className="seats-grid">
        {Array.from({ length: totalSeats }, (_, i) => i + 1).map(seat => (
          <Seat
            key={seat}
            number={seat}
            isOccupied={occupiedSeats.includes(seat)}
            isSelected={selectedSeats.includes(seat)}
            onClick={onSeatClick}
          />
        ))}
      </div>
    </div>
  );
};

export default SeatsGrid;
