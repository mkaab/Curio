export interface Listing {
  id: number;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  condition: 'new_with_tags' | 'like_new' | 'good' | 'fair';
  category: string;
  size?: string;
  brand?: string;
  images: string[];
  status: string;
  moderationStatus: string;
  shareSlug?: string;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  department: string;
  subcategory?: string;
}

