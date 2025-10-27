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
  originalItems?: CartItem[]; // Store original items before edit
  isEdited?: boolean; // Flag to indicate if order was edited
}

export interface TokenResponse {
  tokenNumber: string;
  displayToken: string;
  date: string;
}
