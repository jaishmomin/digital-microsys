import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Countdown timer hook for test-taking.
 * @param {number} initialSeconds - Total seconds to count down from
 * @param {function} onExpire - Callback when timer reaches 0
 * @returns {{ timeRemaining, formatted, isWarning, isCritical, isPaused, pause, resume }}
 */
const useTimer = (initialSeconds, onExpire) => {
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  // Keep onExpire ref fresh
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (isPaused || expiredRef.current) return;

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          if (!expiredRef.current) {
            expiredRef.current = true;
            // Call onExpire in next tick to avoid state update during render
            setTimeout(() => onExpireRef.current?.(), 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isPaused]);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);

  // Format MM:SS
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Warning thresholds
  const isWarning = timeRemaining <= 300 && timeRemaining > 60; // < 5 min
  const isCritical = timeRemaining <= 60; // < 1 min

  return {
    timeRemaining,
    formatted,
    isWarning,
    isCritical,
    isPaused,
    pause,
    resume,
  };
};

export default useTimer;
