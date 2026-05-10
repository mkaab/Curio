import * as React from "react";
import Image from "next/image";
import { Card, CardContent } from "./Card";
import { cn } from "../lib/utils";

export interface ProductCardProps {
  title: string;
  price: number;
  image: string;
  size?: string;
  brand?: string;
  sellerName?: string;
  sellerAvatar?: string;
  className?: string;
}

export function ProductCard({
  title,
  price,
  image,
  size,
  brand,
  sellerName,
  sellerAvatar,
  className,
}: ProductCardProps) {
  return (
    <div className={cn("group cursor-pointer flex flex-col space-y-2", className)}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-neutral-warm">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:brightness-95"
        />
        {size && (
          <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-white/95 rounded-sm text-[10px] font-bold text-text-black shadow-sm">
            {size}
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-base font-bold text-text-black leading-tight">₨ {price.toLocaleString()}</span>
        {brand && <span className="text-[11px] font-semibold text-text-black-soft uppercase tracking-wide leading-tight">{brand}</span>}
        <h3 className="text-[13px] text-text-black-soft line-clamp-1 mt-0.5 leading-tight">{title}</h3>
        
        <div className="mt-2 flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="h-4 w-4 rounded-full bg-brand-green/10 flex items-center justify-center text-[8px] font-bold text-brand-green">
            {sellerName ? sellerName[0] : 'C'}
          </div>
          <span className="text-[10px] text-text-black-soft/60">{sellerName || 'Anonymous'}</span>
        </div>
      </div>
    </div>
  );
}
