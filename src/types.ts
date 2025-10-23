export interface MenuItem {
  id: string;
  name: string;
  halfPrice?: number;  // Optional - only for main and rice
  fullPrice?: number;  // Optional - only for main and rice
  price?: number;      // Optional - only for addon, dessert, drinks
  category: 'main' | 'rice' | 'addon' | 'dessert' | 'drinks';
  kitchen: 'front' | 'back';
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  portion?: 'half' | 'full';
  category?: 'main' | 'rice' | 'addon' | 'dessert' | 'drinks';
  riceType?: string; // For set menu items, stores the selected rice type
  ricePrice?: number; // Additional price for rice upgrade
}

export interface Order {
  id?: string;
  items: CartItem[];
  total: number;
  tokenNumber: string;
  createdAt: Date;
  updatedAt?: Date;
  completedAt?: Date;
  orderType: 'dine-in' | 'take-away';
  status: 'pending' | 'paid' | 'completed' | 'cancelled';
  frontendId?: string;
}

export interface PendingOrder extends Order {
  status: 'pending';
  timestamp: Date; // Alias for createdAt for backward compatibility
}