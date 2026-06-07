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

    // Synchronize hasValue state when the parent prop values change dynamically (controlled inputs / autofill)
    React.useEffect(() => {
      setHasValue(!!props.value || !!props.defaultValue);
    }, [props.value, props.defaultValue]);

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

    // Float the label if focused, has value, or has a placeholder text to prevent overlap collisions
    const isActive = isFocused || hasValue || !!props.placeholder;

    return (
      <div
        className={cn(
          "group relative w-full rounded-xl transition-colors duration-200",
          "bg-surface-container/30 hover:bg-surface-container/50",
          isFocused && "bg-surface-container/10 ring-2 ring-primary ring-offset-1"
        )}
      >
        <label
          className={cn(
            "absolute left-4 transition-all duration-200 pointer-events-none select-none origin-top-left",
            isActive
              ? "translate-y-2 scale-75 text-on-surface font-semibold"
              : "top-1/2 -translate-y-1/2 text-surface-tint"
          )}
        >
          {label}
        </label>
        <input
          type={type}
          className={cn(
            "w-full bg-transparent px-4 pb-2 pt-6 text-base text-on-surface transition-all focus:outline-none",
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
