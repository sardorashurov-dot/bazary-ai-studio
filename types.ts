
export enum ProductStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export type Language = 'ru' | 'uz';

export enum Category {
  CLOTHING = 'Clothing',
  COSMETICS = 'Cosmetics',
  SHOES = 'Shoes',
  ACCESSORIES = 'Accessories',
  ELECTRONICS = 'Electronics',
  HOME_LIVING = 'Home & Living',
  BEAUTY_HEALTH = 'Beauty & Health',
  FOOD_BEVERAGE = 'Food & Beverage',
  SPORTS_OUTDOORS = 'Sports & Outdoors',
  KIDS_TOYS = 'Kids & Toys',
  AUTOMOTIVE = 'Automotive',
  OTHER = 'Other'
}

export enum TargetAudience {
  MEN = 'Men',
  WOMEN = 'Women',
  KIDS = 'Kids',
  UNISEX = 'Unisex',
  NONE = 'General'
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  avatar?: string;
  isRegistered: boolean;
}

export interface ProductVariant {
  name: string;
  options: string[];
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: Category;
  targetAudience?: TargetAudience;
  imageUrl: string;
  videoUrl?: string;
  audioUrl?: string;
  status: ProductStatus;
  variants: ProductVariant[];
  createdAt: number;
  publishedTo?: {
    telegramBot?: boolean;
    telegramChannel?: boolean;
    instagram?: boolean;
  };
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: { productId: string; quantity: number; title: string; price: number }[];
  total: number;
  status: 'new' | 'confirmed' | 'delivered' | 'cancelled';
  createdAt: number;
}

export interface Shop {
  name: string;
  username: string;
  description: string;
  logo?: string;
  telegramToken?: string;
  telegramChannelId?: string;
  instagramId?: string;
  isInstagramConnected?: boolean;
}
