import React, { useState, useEffect } from 'react';

interface SlaTimerProps {
  deadline: string;
}

export const SlaTimer: React.FC<SlaTimerProps> = ({ deadline }) => {
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');
  const [isBreached, setIsBreached] = useState<boolean>(false);

  useEffect(() => {
    const calculateTime = () => {
      const difference = new Date(deadline).getTime() - Date.now();
      
      if (difference <= 0) {
        setTimeLeft('00:00:00');
        setIsBreached(true);
        return;
      }

      setIsBreached(false);
      
      // Calculate hours, minutes, seconds remaining
      const totalSecs = Math.floor(difference / 1000);
      const hrs = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;

      const formattedHrs = hrs.toString().padStart(2, '0');
      const formattedMins = mins.toString().padStart(2, '0');
      const formattedSecs = secs.toString().padStart(2, '0');

      setTimeLeft(`${formattedHrs}:${formattedMins}:${formattedSecs}`);
    };

    calculateTime(); // Initial execution
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (isBreached) {
    return (
      <span style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
        🚨 BREACHED (00:00:00)
      </span>
    );
  }

  // Determine warning color thresholds (amber under 4 hours, green otherwise)
  const difference = new Date(deadline).getTime() - Date.now();
  const hoursLeft = difference / 3600000;
  const color = hoursLeft < 4 ? 'var(--warning)' : 'var(--success)';

  return (
    <span style={{ color, fontWeight: 'bold', fontSize: '0.75rem', fontFamily: 'monospace' }}>
      ⏱ {timeLeft}
    </span>
  );
};
