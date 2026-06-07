import * as React from "react";
import { cn } from "../lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "outline"
    | "black"
    | "dark-outline"
    | "inverted"
    | "outline-dark"
    | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => {
    const variants = {
      primary: "bg-primary text-on-primary border border-primary",
      outline: "bg-transparent text-primary border border-primary",
      black: "bg-black text-white border border-black",
      "dark-outline": "bg-transparent text-on-surface border border-on-surface",
      inverted: "bg-white text-primary border border-white",
      "outline-dark": "bg-transparent text-white border border-white",
      ghost: "bg-transparent text-on-surface border-none hover:bg-surface-container/50",
    };

    const sizes = {
      default: "px-4 py-[7px] text-base",
      sm: "px-3 py-1 text-sm",
      lg: "px-10 py-[14px] text-base",
      icon: "h-10 w-10 p-0",
    };

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-pill font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 btn-active-scale",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
