import React, { useState, useEffect } from 'react';

interface DiceProps {
  rolling: boolean;
  value: number;
  onRollComplete?: () => void;
  label?: string;
  color?: 'red' | 'blue' | 'gray';
}

export const Dice: React.FC<DiceProps> = ({ rolling, value, onRollComplete, label, color = 'gray' }) => {
  const [displayValue, setDisplayValue] = useState(1);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (rolling) {
      interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 20) + 1);
      }, 50);
    } else {
      setDisplayValue(value);
      if (onRollComplete) onRollComplete();
    }
    return () => clearInterval(interval);
  }, [rolling, value, onRollComplete]);

  const colorClasses = {
    red: 'border-red-600 text-red-500 shadow-red-900/50',
    blue: 'border-blue-600 text-blue-500 shadow-blue-900/50',
    gray: 'border-stone-600 text-stone-400 shadow-stone-900/50'
  }[color];

  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className={`w-16 h-16 flex items-center justify-center border-4 rounded-xl bg-stone-900 shadow-[0_0_15px_rgba(0,0,0,0.5)] text-3xl font-serif font-bold transition-all duration-300 ${colorClasses} ${rolling ? 'animate-pulse' : ''}`}
      >
        {displayValue}
      </div>
      {label && <span className="text-xs text-stone-500 font-serif">{label}</span>}
    </div>
  );
};