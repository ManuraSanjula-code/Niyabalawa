export interface MenuItem {
  id: string;
  name: string;
  halfPrice: number;
  fullPrice: number;
  category: 'main' | 'rice' | 'addon';
  kitchen: 'front' | 'back';
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  portion?: 'half' | 'full';
  category?: 'main' | 'rice' | 'addon';
  riceType?: string;
  ricePrice?: number;
}

export interface Order {
  id: string;
  tokenNumber: string;
  orderType: 'dine-in' | 'take-away';
  status: 'pending' | 'paid' | 'completed' | 'cancelled';
  items: CartItem[];
  total: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  frontendId?: string;
}

export interface TokenResponse {
  tokenNumber: string;
  displayToken: string;
  date: string;
}
