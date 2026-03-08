// src/context/CartContext.jsx
import { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('');

  const addItem = (product) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        return prev.map(i => i.product_id === product.id
          ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price }
          : i
        );
      }
      return [...prev, {
        product_id: product.id, name: product.name,
        price: parseFloat(product.price), quantity: 1, subtotal: parseFloat(product.price)
      }];
    });
  };

  const removeItem = (productId) => setItems(prev => prev.filter(i => i.product_id !== productId));

  const updateQuantity = (productId, qty) => {
    if (qty <= 0) { removeItem(productId); return; }
    setItems(prev => prev.map(i => i.product_id === productId
      ? { ...i, quantity: qty, subtotal: qty * i.price } : i
    ));
  };

  const clearCart = () => { setItems([]); setPaymentMethod(''); };

  const total = items.reduce((s, i) => s + i.subtotal, 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, paymentMethod, setPaymentMethod, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
