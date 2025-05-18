import React from 'react';
import '../styles/components.css';

interface ScreeningButtonProps {
  id: string;
  time: string;
  onSelect: (id: string) => void;
}

const ScreeningButton: React.FC<ScreeningButtonProps> = ({ id, time, onSelect }) => {
  return (
    <button 
      className="screening-button"
      onClick={() => onSelect(id)}
    >
      {time}
    </button>
  );
};

export default ScreeningButton;
