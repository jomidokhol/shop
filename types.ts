
export interface UserData {
  uid: string;
  name: string;
  email: string;
  profileId: string;
  walletBalance: number;
  status: 'active' | 'blocked';
  role?: 'admin' | 'user';
  photoURL?: string;
  createdAt?: any;
  referralCode?: string;
  referredBy?: string;
  referralCount?: number;
  wishlist?: string[];
}

export interface Package {
  amount: string;
  price: number;
  stock: number;
}

export interface Game {
  id: string;
  name: string;
  logo: string;
  banner: string;
  category: string;
  status: 'active' | 'unavailable';
  rank: number;
  badgeText?: string;
  inputType?: 'userid' | 'email' | 'mobile_number';
  description?: string;
  tutorialLink?: string;
  packages: Package[];
}

export interface Order {
  id: string;
  userId: string;
  game: string;
  package: string;
  quantity: number;
  price: number;
  playerId: string;
  inputTypeLabel: string;
  paymentMethod: string;
  adminNumber?: string;
  userPaymentNumber?: string;
  transactionId: string;
  status: 'Pending' | 'Completed' | 'Rejected' | 'Canceled';
  date: any;
  adminNote?: string;
  voucherCode?: string;
  discountAmount?: number;
}

export interface MoneyRequest {
  id: string;
  userId: string;
  amount: number;
  paymentMethod: string;
  adminNumber: string;
  userPaymentNumber: string;
  transactionId: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  date: any;
}

export interface PaymentMethod {
  id: string;
  name: string;
  logoUrl: string;
  number: string;
}

export interface Voucher {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  isActive: boolean;
  expiryDate?: any;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: number;
  read: boolean;
  orderId?: string;
}
