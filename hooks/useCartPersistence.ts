'use client';

import { useEffect } from 'react';

interface CartPersistenceOptions {
  cartKey?: string;
  customerNameKey?: string;
}

export function useCartPersistence<T extends object>(
  cart: T[],
  setCart: (cart: T[]) => void,
  customerName: string,
  setCustomerName: (name: string) => void,
  options: CartPersistenceOptions = {}
) {
  const { cartKey = 'cashier_cart', customerNameKey = 'cashier_customerName' } = options;

  // Save to localStorage whenever cart or customerName changes
  useEffect(() => {
    try {
      localStorage.setItem(cartKey, JSON.stringify(cart));
      localStorage.setItem(customerNameKey, customerName);
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [cart, customerName, cartKey, customerNameKey]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(cartKey);
      const savedCustomerName = localStorage.getItem(customerNameKey);

      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        setCart(parsed);
      }

      if (savedCustomerName) {
        setCustomerName(savedCustomerName);
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
    }
  }, [cartKey, customerNameKey, setCart, setCustomerName]);
}
