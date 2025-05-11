"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => {
    // Ensure value is between 0 and 100
    const percentValue = Math.max(0, Math.min(100, value));

    return (
      <div
        ref={ref}
        className={cn(
          "relative h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700",
          className
        )}
        {...props}
      >
        <div
          className="h-full bg-orange-400 transition-all duration-300 ease-in-out"
          style={{ width: `${percentValue}%` }}
        />
      </div>
    );
  }
);

Progress.displayName = "Progress";

export { Progress } 