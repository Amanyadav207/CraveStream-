import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, DollarSign } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const UserFeed = () => {
    const [foodItems, setFoodItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();
    const containerRef = useRef(null);

    useEffect(() => {
        const fetchFood = async () => {
            try {
                const { data } = await api.get('/food');
                setFoodItems(data.foodItems);
            } catch (error) {
                console.error("Failed to fetch food items", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFood();
    }, []);

    // Intersection Observer for auto-play could be added here
    // For now, simpler implementation with controls

    if (loading) {
        return <div className="flex items-center justify-center h-screen text-xl">Loading delicious feeed...</div>;
    }

    return (
        <div className="h-[calc(100vh-64px)] overflow-y-scroll snap-y snap-mandatory bg-black">
            {foodItems.map((item) => (
                <div key={item._id} className="h-full w-full relative snap-start flex items-center justify-center bg-dark border-b border-gray-800">
                    {/* Video Player */}
                    <video 
                        src={item.video}
                        className="h-full w-full object-cover md:w-[400px] md:rounded-xl md:h-[95%] md:my-4"
                        loop
                        controls
                        playsInline
                    />

                    {/* Overlay Info (Mobile style or Sidebar style) */}
                    <div className="absolute bottom-20 left-4 md:left-[50%] md:ml-[-200px] md:bottom-10 z-10 w-full max-w-[400px] p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <h3 className="text-2xl font-bold text-white mb-1">{item.name}</h3>
                        <p className="text-gray-200 text-sm line-clamp-2 mb-2">{item.description}</p>
                        <div className="flex items-center justify-between mt-2">
                             <span className="text-primary font-bold text-xl flex items-center">
                                <DollarSign className="w-5 h-5" /> {item.price}
                             </span>
                             <button 
                                onClick={() => addToCart(item)}
                                className="bg-primary text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-orange-600 transition-transform active:scale-95"
                             >
                                 Order Now
                             </button>
                        </div>
                    </div>

                    {/* Actions Sidebar */}
                    <div className="absolute right-4 bottom-32 flex flex-col gap-6 items-center md:right-[50%] md:mr-[-260px]">
                        <button className="flex flex-col items-center gap-1 text-white hover:text-primary transition-colors">
                            <div className="bg-black/40 p-3 rounded-full backdrop-blur-sm">
                                <Heart className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold">Like</span>
                        </button>
                        <button className="flex flex-col items-center gap-1 text-white hover:text-primary transition-colors">
                            <div className="bg-black/40 p-3 rounded-full backdrop-blur-sm">
                                <MessageCircle className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold">24</span>
                        </button>
                        <button className="flex flex-col items-center gap-1 text-white hover:text-primary transition-colors">
                            <div className="bg-black/40 p-3 rounded-full backdrop-blur-sm">
                                <Share2 className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold">Share</span>
                        </button>
                    </div>
                </div>
            ))}
            
            {foodItems.length === 0 && (
                <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400">No food items found. Be the first partner to upload!</p>
                </div>
            )}
        </div>
    );
};

export default UserFeed;
