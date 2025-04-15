import React, { useEffect, useState } from 'react';

/**
 * NumberSpinner component that displays a spinning animation of numbers
 * before showing the final value. Used to create an engaging loading experience.
 */
const NumberSpinner = ({ value, color, isLoading }) => {
  const [digits, setDigits] = useState([]);
  
  // Create the spinning digits when the component mounts
  useEffect(() => {
    // Convert value to string to handle multi-digit numbers
    const valueString = value?.toString() || '0';
    const digitCount = valueString.length || 1; // Ensure at least 1 digit
    
    // Create array of digit positions, one for each digit in the final value
    setDigits(Array(digitCount).fill(0));
  }, [value]);

  if (!isLoading && value !== undefined) {
    // When not loading, just show the value normally
    return (
      <div className={`text-3xl font-bold text-${color}-600`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
    );
  }

  return (
    <div className={`text-3xl font-bold flex`}>
      {digits.map((_, index) => (
        <div 
          key={index} 
          className={`inline-block overflow-hidden relative mx-px`}
          style={{ height: '38px' }}
        >
          <div 
            className="flex flex-col animate-spin-numbers"
            style={{ 
              animation: `spinNumbers 2s cubic-bezier(.2,0,.85,1) infinite`,
            }}
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num, i) => (
              <span 
                key={`${index}-${i}`} 
                className={`h-8 leading-8 font-bold text-${color}-600`}
                style={{ height: '30px', lineHeight: '30px' }}
              >
                {num}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Default props
NumberSpinner.defaultProps = {
  color: 'blue',
  isLoading: true
};

export default NumberSpinner;
