import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@heroui/react";
import { cn } from "../lib/utils";

export interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  size?: string;
  brand?: string;
  sellerName?: string;
  sellerAvatar?: string;
  isFavorite?: boolean;
  favoriteCount?: number;
  onToggleFavorite?: (e: React.MouseEvent) => void;
  className?: string;
}

export function ProductCard({
  id,
  title,
  price,
  image,
  size,
  brand,
  isFavorite,
  favoriteCount = 0,
  onToggleFavorite,
  className,
}: ProductCardProps) {
  return (
    <Link href={`/item/${id}`} className="group block cursor-pointer h-full">
      <Card 
        className={cn(
          "h-full flex flex-col bg-transparent border-none shadow-none overflow-hidden transition-all duration-300", 
          className
        )}
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-dim rounded-md">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
            className="object-cover transition-transform duration-500"
          />
          
          {/* Vinted style Favorite Pill */}
          {onToggleFavorite && (
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault(); // prevent link navigation
                e.stopPropagation(); // prevent card click
                onToggleFavorite(e);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleFavorite(e as any);
                }
              }}
              className="absolute bottom-2 right-2 px-2 py-1.5 flex items-center space-x-1.5 rounded-full bg-white text-on-surface shadow-sm z-10 hover:bg-surface-dim transition-colors cursor-pointer"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="12" 
                height="12" 
                viewBox="0 0 24 24"
                fill={isFavorite ? "currentColor" : "none"} 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className={isFavorite ? "text-primary" : "text-on-surface-variant"}
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
              {favoriteCount > 0 && (
                <span className="text-[11px] font-bold text-on-surface-variant leading-none">
                  {favoriteCount}
                </span>
              )}
            </div>
          )}
        </div>
        
        <CardContent className="p-0 pt-2 flex flex-col flex-grow">
          {/* Brand or Title */}
          <p className="text-[12px] text-on-surface-variant font-medium truncate mb-0.5">
            {brand || title}
          </p>
          
          {/* Size and Condition */}
          <p className="text-[12px] text-on-surface-variant mb-1 truncate">
            {size || "OS"} · Good
          </p>
          
          {/* Base Price */}
          <p className="text-[15px] font-bold text-on-surface leading-tight mb-0.5">
            ₨ {price.toLocaleString()}
          </p>
          
          {/* Price with Buyer Protection (incl.) */}
          <div className="text-[11px] text-surface-tint mt-0.5 flex items-center space-x-1">
            <span>₨ {(price + 150 + Math.round(price * 0.05)).toLocaleString()} incl.</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-surface-tint">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
