// src/context/CartContext.jsx
import { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('');

  const addItem = useCallback((product) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        // No exceder stock
        if (existing.quantity >= product.stock) return prev;
        return prev.map(i =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity + 1, subtotal: parseFloat(product.price) * (i.quantity + 1) }
            : i
        );
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: 1,
        subtotal: parseFloat(product.price),
        maxStock: product.stock
      }];
    });
  }, []);

  const removeItem = useCallback((productId) => {
    setItems(prev => prev.filter(i => i.product_id !== productId));
  }, []);

  const updateQuantity = useCallback((productId, qty) => {
    if (qty <= 0) { removeItem(productId); return; }
    setItems(prev => prev.map(i =>
      i.product_id === productId
        ? { ...i, quantity: Math.min(qty, i.maxStock), subtotal: i.price * Math.min(qty, i.maxStock) }
        : i
    ));
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    setPaymentMethod('');
  }, []);

  const total = items.reduce((sum, i) => sum + i.subtotal, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, paymentMethod, setPaymentMethod,
      addItem, removeItem, updateQuantity, clearCart,
      total, itemCount
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
