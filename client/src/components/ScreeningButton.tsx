import React from 'react';
import '../styles/components.css';

interface ScreeningButtonProps {
  id: string;
  time: string;
  onSelect: (id: string) => void;
  title?: string;
}

const ScreeningButton: React.FC<ScreeningButtonProps> = ({ id, time, onSelect, title }) => {
  return (
    <button 
      className="screening-button"
      onClick={() => onSelect(id)}
    >
      {title ? `${title} - ${time}` : time}
    </button>
  );
};

export default ScreeningButton;
