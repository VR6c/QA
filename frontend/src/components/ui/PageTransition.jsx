import React, { useEffect, useState } from 'react';

/**
 * PageTransition Component
 * Wraps content and applies smooth directional page entrance animations:
 * - 'next': slide in from right to left
 * - 'prev': slide in from left to right
 * - 'jump': fade & scale zoom-in
 */
export default function PageTransition({
  children,
  page = 1,
  direction = 'next',
  className = '',
  as: Component = 'div',
  ...props
}) {
  const [animClass, setAnimClass] = useState('');
  const [key, setKey] = useState(page);

  useEffect(() => {
    // Determine animation class based on direction
    let selectedClass = 'animate-page-next';
    if (direction === 'prev') {
      selectedClass = 'animate-page-prev';
    } else if (direction === 'jump') {
      selectedClass = 'animate-page-jump';
    }

    setAnimClass(selectedClass);
    setKey(`${page}-${direction}-${Date.now()}`);

    const timer = setTimeout(() => {
      // Keep final state active or clean up animation class
    }, 300);

    return () => clearTimeout(timer);
  }, [page, direction]);

  return (
    <Component
      key={key}
      className={`${animClass} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
