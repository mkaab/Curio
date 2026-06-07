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

    // Synchronize hasValue state when the textarea values change dynamically
    React.useEffect(() => {
      setHasValue(!!props.value || !!props.defaultValue);
    }, [props.value, props.defaultValue]);

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

    const isActive = isFocused || hasValue || !!props.placeholder;

    return (
      <div className="group relative w-full">
        <label
          className={cn(
            "absolute left-3 transition-all duration-300 pointer-events-none select-none z-10",
            isActive
              ? "top-2 text-xs font-bold text-on-surface uppercase tracking-wider"
              : "top-4 text-base text-surface-tint"
          )}
        >
          {label}
        </label>
        <textarea
          className={cn(
            "w-full rounded-lg border border-surface-container bg-surface px-3 pb-3 pt-8 text-base text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-0 group-hover:border-primary/50 min-h-[120px] resize-none",
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
