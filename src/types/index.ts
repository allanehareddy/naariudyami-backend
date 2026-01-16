export type UserRole = 'woman' | 'customer' | 'hub_manager';

export interface IUser {
  _id?: string;
  name: string;
  role: UserRole;
  village?: string;
  district?: string;
  state?: string;
  password: string;
  createdAt: Date;
}

export interface IProduct {
  _id?: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  price: number;
  predictedPrice?: number;
  userId: string;
  createdAt: Date;
}

export interface IGovernmentScheme {
  _id?: string;
  name: string;
  description: string;
  link: string;
  minIncome?: number;
  maxIncome?: number;
  eligibility: string;
}

export interface ICustomerRequest {
  _id?: string;
  customerId: string;
  entrepreneurId: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export interface IVillageStats {
  village: string;
  womenCount: number;
  productsCount: number;
}

