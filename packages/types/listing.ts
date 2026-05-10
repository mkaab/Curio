import { User } from './user';

export interface Listing {
  id: string;
  sellerId: string;
  title: string;
  description?: string;
  categoryId: number;
  brandId: number;
  condition: 'new_with_tags' | 'like_new' | 'good' | 'fair';
  size: string;
  fabric?: string;
  color: string[];
  pricePkr: number;
  originalPricePkr?: number;
  photos: ListingPhoto[];
  status: 'draft' | 'active' | 'sold' | 'archived';
  views: number;
  likes: number;
  isBoosted: boolean;
  boostExpiresAt?: Date;
  city: string;
  allowOffers: boolean;
  createdAt: Date;
  soldAt?: Date;
}

export interface ListingPhoto {
  url: string;
  order: number;
  width: number;
  height: number;
}
