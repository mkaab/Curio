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
  sellerName,
  sellerAvatar,
  isFavorite,
  onToggleFavorite,
  className,
}: ProductCardProps) {
  return (
    <Link href={`/item/${id}`} className="group block cursor-pointer h-full">
      <Card 
        className={cn(
          "h-full flex flex-col bg-white border border-surface-container rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 shadow-sm", 
          className
        )}
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-dim">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Favorite Button */}
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
              className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/70 backdrop-blur-md hover:bg-white transition-all shadow-sm z-10 scale-95 group-hover:scale-100 cursor-pointer"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="14" 
                height="14" 
                viewBox="0 0 24 24"
                fill={isFavorite ? "currentColor" : "none"} 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className={isFavorite ? "text-primary" : "text-on-surface"}
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
            </div>
          )}

          {size && (
            <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 bg-primary text-white rounded-md text-[9px] font-bold uppercase tracking-wider shadow-sm z-10">
              {size}
            </div>
          )}
        </div>
        <CardContent className="p-3 flex flex-col flex-grow justify-between">
          <div>
            <div className="flex flex-col">
              <span className="text-base font-serif font-bold text-primary leading-none">₨ {price.toLocaleString()}</span>
              <div className="text-[10px] font-semibold text-surface-tint mt-1 flex items-center space-x-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="text-surface-tint shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>₨ {(price + 150 + Math.round(price * 0.05)).toLocaleString()} insured</span>
              </div>
            </div>
            {brand ? (
              <p className="text-[10px] font-bold text-surface-tint uppercase tracking-wider leading-none mt-2">{brand}</p>
            ) : (
              <p className="text-[10px] leading-none mt-2 select-none" aria-hidden="true">&nbsp;</p>
            )}
            <h3 className="text-sm font-serif text-on-surface truncate mt-1 leading-tight font-medium" title={title}>{title}</h3>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
