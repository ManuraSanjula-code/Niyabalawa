import { useState, useCallback } from 'react';
import { CartItem, MenuItem } from '../types';

const generateTokenNumber = (): string => {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `T${timestamp}${random}`;
};

export const useBilling = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tokenNumber] = useState<string>(generateTokenNumber());

  const addToCart = useCallback((item: MenuItem, portion?: 'half' | 'full') => {
    const price = portion === 'half' ? item.halfPrice : item.fullPrice;
    const cartItemId = `${item.id}-${portion || 'default'}`;
    
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === cartItemId);
      
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === cartItemId
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, {
          id: cartItemId,
          name: item.name,
          price,
          quantity: 1,
          portion
        }];
      }
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return {
    cart,
    tokenNumber,
    total,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart
  };
};