export interface User {
  id: string;
  phone: string;
  email?: string;
  fullName: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  verifiedCnic: boolean;
  ratingAvg: number;
  ratingCount: number;
  walletBalance: number;
  isActive: boolean;
  createdAt: Date;
}
