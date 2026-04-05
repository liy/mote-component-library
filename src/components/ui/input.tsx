"use client";

import * as React from "react";

import { cn } from "../../lib/cn";

type InputProps = Omit<React.ComponentProps<"input">, "className"> & {
  icon?: React.ReactNode;
  className?: string;
  inputClassName?: string;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, inputClassName, type, ...props }, ref) => {
    return (
      <div
        data-slot="input"
        className={cn(
          "relative flex h-11 w-full items-center rounded-[0.75rem] border border-border/70 bg-input text-foreground backdrop-blur-xl transition focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-ring has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
          className
        )}
      >
        {icon ? (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-5 [&_svg]:shrink-0">
            {icon}
          </span>
        ) : null}
        <input
          ref={ref}
          type={type}
          className={cn(
            "flex h-full w-full rounded-[inherit] border-0 bg-transparent px-3.5 text-sm outline-none placeholder:text-muted-foreground/90",
            icon && "pl-11",
            inputClassName
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
