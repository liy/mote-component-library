"use client";

import * as React from "react";

import { cn } from "../../lib/cn";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-border/70 bg-input px-3.5 text-sm text-foreground shadow-sm outline-none backdrop-blur-xl transition focus-visible:border-primary/60 focus-visible:ring-4 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-muted-foreground/90",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
