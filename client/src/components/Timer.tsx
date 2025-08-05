import { useState, useEffect } from "react";

interface TimerProps {
  isRunning: boolean;
  onTimeUpdate: (seconds: number) => void;
}

export default function Timer({ isRunning, onTimeUpdate }: TimerProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(prevSeconds => {
          const newSeconds = prevSeconds + 1;
          onTimeUpdate(newSeconds);
          return newSeconds;
        });
      }, 1000);
    } else {
      if (interval) {
        clearInterval(interval);
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, onTimeUpdate]);

  useEffect(() => {
    if (!isRunning) {
      setSeconds(0);
    }
  }, [isRunning]);

  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-muted rounded-lg px-4 py-2" data-testid="timer-container">
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-1">TIME</p>
        <p className="text-xl font-bold text-primary" data-testid="timer-display">
          {formatTime(seconds)}
        </p>
      </div>
    </div>
  );
}
