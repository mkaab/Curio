"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(!!props.value || !!props.defaultValue);

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
              ? "top-2 text-xs font-bold text-text-black uppercase tracking-wider"
              : "top-4 text-base text-text-black-soft"
          )}
        >
          {label}
        </label>
        <textarea
          className={cn(
            "w-full rounded-lg border border-ceramic bg-white px-3 pb-3 pt-8 text-base text-text-black transition-all focus:border-accent-green focus:outline-none focus:ring-0 group-hover:border-accent-green/50 min-h-[120px] resize-none",
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
Textarea.displayName = "Textarea";

export { Textarea };
