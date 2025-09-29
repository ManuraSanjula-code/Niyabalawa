export interface MenuItem {
  id: string;
  name: string;
  halfPrice: number;
  fullPrice: number;
  category: 'main' | 'rice' | 'addon';
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  portion?: 'half' | 'full';
}

export interface Order {
  items: CartItem[];
  total: number;
  tokenNumber: string;
  timestamp: Date;
}