"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { label: string; value: string }[];
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(!!props.value || !!props.defaultValue);

    // Synchronize hasValue state when the select values change dynamically
    React.useEffect(() => {
      setHasValue(!!props.value || !!props.defaultValue);
    }, [props.value, props.defaultValue]);

    const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setHasValue(!!e.target.value);
      props.onChange?.(e);
    };

    const isActive = isFocused || hasValue;

    return (
      <div className="group relative w-full">
        <label
          className={cn(
            "absolute left-3 transition-all duration-300 pointer-events-none select-none z-10",
            isActive
              ? "top-2 text-xs font-bold text-on-surface uppercase tracking-wider"
              : "top-1/2 -translate-y-1/2 text-base text-surface-tint"
          )}
        >
          {label}
        </label>
        <select
          className={cn(
            "w-full appearance-none rounded-lg border border-surface-container bg-surface px-3 pb-2 pt-6 text-base text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-0 group-hover:border-primary/50 cursor-pointer",
            className
          )}
          ref={ref}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        >
          <option value="" disabled hidden></option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-on-surface">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-surface-tint group-focus-within:text-primary transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
