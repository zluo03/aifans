export interface AIPlatform {
  id: number;
  name: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  category?: string;
  features?: string[];
  pricing?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  sortOrder?: number;
} 