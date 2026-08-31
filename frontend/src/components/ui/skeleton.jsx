import React from 'react';
import { cn } from '../../lib/utils';

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[rgb(244,241,242)]", className)}
      {...props}
    />
  );
}

export { Skeleton };
export default Skeleton;
