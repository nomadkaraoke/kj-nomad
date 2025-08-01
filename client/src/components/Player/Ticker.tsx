import React from 'react';
import './Ticker.css';

interface TickerProps {
  text: string;
}

const Ticker: React.FC<TickerProps> = ({ text }) => {
  return (
    <div className="ticker-wrap">
      <div className="ticker">
        <div className="ticker-item">{text}</div>
      </div>
    </div>
  );
};

export default Ticker;
