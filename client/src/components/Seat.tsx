import React from 'react';
import '../styles/components.css';

interface SeatProps {
  number: number;
  isOccupied: boolean;
  isSelected: boolean;
  onClick: (seat: number) => void;
}

const Seat: React.FC<SeatProps> = ({ number, isOccupied, isSelected, onClick }) => {
  let className = 'seat';
  if (isOccupied) className += ' occupied';
  else if (isSelected) className += ' selected';
  else className += ' available';

  return (
    <div
      className={className}
      onClick={() => !isOccupied && onClick(number)}
    >
      {number}
    </div>
  );
};

export default Seat;
