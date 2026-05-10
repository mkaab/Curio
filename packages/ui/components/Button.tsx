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
    | "outline-dark";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => {
    const variants = {
      primary: "bg-accent-green text-white border border-accent-green",
      outline: "bg-transparent text-accent-green border border-accent-green",
      black: "bg-black text-white border border-black",
      "dark-outline": "bg-transparent text-text-black border border-text-black",
      inverted: "bg-white text-accent-green border border-white",
      "outline-dark": "bg-transparent text-white border border-white",
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
          "inline-flex items-center justify-center rounded-pill font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green disabled:pointer-events-none disabled:opacity-50 btn-active-scale",
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
