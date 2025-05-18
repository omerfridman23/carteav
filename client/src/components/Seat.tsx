import React from 'react';
import '../styles/components.css';

interface SeatProps {
  number: number;
  isOccupied: boolean;
  isSelected: boolean;
  isReservedByMe: boolean;
  onClick: (seat: number) => void;
}

const Seat: React.FC<SeatProps> = ({ 
  number, 
  isOccupied, 
  isSelected, 
  isReservedByMe,
  onClick 
}) => {
  let className = 'seat';
  
  if (isReservedByMe) {
    className += ' reserved-by-me';
  } else if (isOccupied) {
    className += ' occupied';
  } else if (isSelected) {
    className += ' selected';
  } else {
    className += ' available';
  }

  return (
    <div
      className={className}
      onClick={() => (isReservedByMe || !isOccupied) && onClick(number)}
    >
      {number}
    </div>
  );
};

export default Seat;
