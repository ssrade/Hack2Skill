"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "./utils";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-gray-200 dark:bg-gray-700 relative h-2 w-full overflow-hidden rounded-full",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-blue-600 dark:bg-blue-500 h-full flex-1 transition-all duration-300 ease-out"
        style={{ 
          transform: `translateX(-${100 - (value || 0)}%)`,
          width: '100%',
          minWidth: value && value > 0 ? '2%' : '0%'
        }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
