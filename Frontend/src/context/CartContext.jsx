import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const addToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(i => i._id === item._id);
            if (existing) {
                return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (itemId) => {
        setCart(prev => prev.filter(i => i._id !== itemId));
    };

    const updateQuantity = (itemId, delta) => {
        setCart(prev => prev.map(i => {
            if (i._id === itemId) {
                return { ...i, quantity: Math.max(1, i.quantity + delta) };
            }
            return i;
        }));
    };

    const toggleCart = () => setIsCartOpen(!isCartOpen);
    
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, isCartOpen, toggleCart, cartTotal, cartCount }}>
            {children}
        </CartContext.Provider>
    );
};
