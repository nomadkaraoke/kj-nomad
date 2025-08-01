import React from 'react';
import './Ticker.css';

interface TickerProps {
  text: string;
  variant?: 'default' | 'accent' | 'minimal';
  position?: 'top' | 'bottom';
}

const Ticker: React.FC<TickerProps> = ({ 
  text, 
  variant = 'default',
  position = 'bottom'
}) => {
  if (!text || text.trim() === '') {
    return null;
  }

  return (
    <div className={`ticker-wrap ${position} ${variant}`} data-testid="ticker">
      <div className="ticker">
        <div className="ticker-item">{text}</div>
        {/* Duplicate for seamless loop */}
        <div className="ticker-item">{text}</div>
      </div>
    </div>
  );
};

export default Ticker;
