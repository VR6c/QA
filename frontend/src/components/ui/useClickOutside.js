import { useEffect, useRef } from 'react';

/**
 * Hook that alerts clicks outside of the passed ref
 */
export function useClickOutside(handler) {
  const domNodeRef = useRef(null);

  useEffect(() => {
    const maybeHandler = (event) => {
      if (domNodeRef.current && !domNodeRef.current.contains(event.target)) {
        handler();
      }
    };

    document.addEventListener('mousedown', maybeHandler);
    document.addEventListener('touchstart', maybeHandler);

    return () => {
      document.removeEventListener('mousedown', maybeHandler);
      document.removeEventListener('touchstart', maybeHandler);
    };
  }, [handler]);

  return domNodeRef;
}
