"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(!!props.value || !!props.defaultValue);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      props.onChange?.(e);
    };

    const isActive = isFocused || hasValue;

    return (
      <div className="group relative w-full">
        <label
          className={cn(
            "absolute left-3 transition-all duration-300 pointer-events-none select-none",
            isActive
              ? "top-2 text-xs font-bold text-text-black uppercase tracking-wider"
              : "top-1/2 -translate-y-1/2 text-base text-text-black-soft"
          )}
        >
          {label}
        </label>
        <input
          type={type}
          className={cn(
            "w-full rounded-lg border border-ceramic bg-white px-3 pb-2 pt-6 text-base text-text-black transition-all focus:border-accent-green focus:outline-none focus:ring-0 group-hover:border-accent-green/50",
            className
          )}
          ref={ref}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
