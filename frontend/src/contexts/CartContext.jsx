import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('shopkey_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('shopkey_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product, plan, quantity = 1) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(item => item.plan.id === plan.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity += quantity;
        return next;
      }
      return [...prev, {
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          image: product.image
        },
        plan: {
          id: plan.id,
          name: plan.name,
          price: plan.price,
          sale_price: plan.sale_price,
          unitPrice: plan.sale_price > 0 ? plan.sale_price : plan.price,
          duration_type: plan.duration_type,
          duration_value: plan.duration_value,
          in_stock: plan.in_stock
        },
        quantity
      }];
    });
  };

  const updateQuantity = (planId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(planId);
      return;
    }
    setItems(prev => prev.map(item => {
      if (item.plan.id === planId) {
        return { ...item, quantity };
      }
      return item;
    }));
  };

  const removeFromCart = (planId) => {
    setItems(prev => prev.filter(item => item.plan.id !== planId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.plan.unitPrice * item.quantity), 0);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      totalAmount,
      totalCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
