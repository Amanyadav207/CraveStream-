import React from 'react';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const CartSidebar = () => {
    const { isCartOpen, toggleCart, cart, updateQuantity, removeFromCart, cartTotal } = useCart();

    if (!isCartOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex justify-end">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={toggleCart}></div>
            <div className="relative w-full max-w-md bg-card h-full shadow-2xl flex flex-col glass border-l border-white/10 animate-slide-in">
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
                    <h2 className="text-2xl font-bold">Your Order</h2>
                    <button onClick={toggleCart} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {cart.length === 0 ? (
                        <div className="text-center text-gray-500 mt-20">
                            <p className="text-lg">Your cart is empty</p>
                            <button onClick={toggleCart} className="mt-4 text-primary hover:underline">Browse Food</button>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item._id} className="flex gap-4 mb-4 bg-black/20 p-4 rounded-xl">
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                                    <p className="text-primary font-bold">${item.price}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-3 bg-dark rounded-full px-2 py-1 border border-white/10">
                                        <button onClick={() => updateQuantity(item._id, -1)} className="p-1 hover:text-primary"><Minus className="w-4 h-4" /></button>
                                        <span className="font-medium w-4 text-center">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item._id, 1)} className="p-1 hover:text-primary"><Plus className="w-4 h-4" /></button>
                                    </div>
                                    <button onClick={() => removeFromCart(item._id)} className="text-gray-500 hover:text-red-500 transition-colors p-1">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 border-t border-white/10 bg-black/40">
                    <div className="flex justify-between mb-4 text-xl font-bold">
                        <span>Total</span>
                        <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <button className="w-full bg-primary py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg shadow-primary/20">
                        Checkout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CartSidebar;
