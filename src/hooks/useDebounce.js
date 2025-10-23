import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to debounce a value
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {any} - The debounced value
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Custom hook to prevent rapid API calls
 * @param {Function} callback - The API function to call
 * @param {number} delay - Delay between calls in milliseconds
 * @returns {Function} - The debounced function
 */
export const useApiDebounce = (callback, delay = 300) => {
  const timeoutRef = useRef(null);

  return (...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  };
};

/**
 * Custom hook to manage loading states with minimum duration
 * @param {number} minDuration - Minimum loading duration in ms
 * @returns {Object} - Loading state and setter
 */
export const useStableLoading = (minDuration = 500) => {
  const [isLoading, setIsLoading] = useState(false);
  const loadingStartRef = useRef(null);

  const setLoading = (loading) => {
    if (loading) {
      setIsLoading(true);
      loadingStartRef.current = Date.now();
    } else {
      const elapsed = loadingStartRef.current ? Date.now() - loadingStartRef.current : 0;
      const remaining = Math.max(0, minDuration - elapsed);
      
      if (remaining > 0) {
        setTimeout(() => setIsLoading(false), remaining);
      } else {
        setIsLoading(false);
      }
    }
  };

  return { isLoading, setLoading };
};