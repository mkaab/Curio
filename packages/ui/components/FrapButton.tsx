import * as React from "react";
import { cn } from "../lib/utils";
import { ShoppingBag } from "lucide-react";

export interface FrapButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "default" | "sm";
}

const FrapButton = React.forwardRef<HTMLButtonElement, FrapButtonProps>(
  ({ className, size = "default", ...props }, ref) => {
    const sizes = {
      default: "h-14 w-14",
      sm: "h-10 w-10",
    };

    return (
      <button
        className={cn(
          "fixed bottom-8 right-8 z-50 flex items-center justify-center rounded-full bg-primary text-on-primary shadow-frap transition-all duration-200 btn-active-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      >
        <ShoppingBag className={cn(size === "default" ? "h-6 w-6" : "h-5 w-5")} />
      </button>
    );
  }
);
FrapButton.displayName = "FrapButton";

export { FrapButton };
