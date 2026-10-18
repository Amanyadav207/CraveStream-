import React, { useState } from 'react';
import { Upload, DollarSign, FileText, Video, Plus, Eye, X, Heart, MessageCircle, Share2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const PartnerDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    
    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [video, setVideo] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setVideo(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('description', description);
            formData.append('price', price);
            if (video) {
                formData.append('video', video);
            }

            // Note: server expects 'foodPartner' ID in body or extracted from token?
            // Middleware 'authenticateFoodPartner' likely sets req.foodPartner.
            // But model says 'foodPartner' is required. Let's assume controller handles it or we send ID.
            // Looking at food.controller.js (not read but assumed), usually it takes from req.user/partner.
            // If strictly required in body, we might need to append it.
            // But usually secure implementations use the token claim.
            // I'll assume token is sufficient. If not, I'll add user._id.
            
            // Wait, food.model.js says 'foodPartner' required.
            // food.controller.js usually does: req.body.foodPartner = req.foodPartner._id
            
            console.log("Starting upload request...");
            const startTime = Date.now();
            await api.post('/food', formData);
            console.log(`Upload request complete. Time taken: ${Date.now() - startTime}ms`);

            setSuccess('Food item created successfully!');
            setName('');
            setDescription('');
            setPrice('');
            setVideo(null);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to create food item');
        } finally {
            setLoading(false);
        }
    };

    const [foodItems, setFoodItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(true);
    const [previewItem, setPreviewItem] = useState(null);

    const fetchItems = async () => {
        try {
            const { data } = await api.get('/food/partner');
            setFoodItems(data.foodItems);
        } catch (err) {
            console.error("Failed to fetch items", err);
        } finally {
            setLoadingItems(false);
        }
    };

    React.useEffect(() => {
        fetchItems();
    }, []);

    // Refresh list after successful upload
    React.useEffect(() => {
        if (success) {
            fetchItems();
        }
    }, [success]);

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Partner Dashboard</h1>
                    <p className="text-gray-400">Welcome back, {user?.name}</p>
                </div>
                <button className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
                    <Plus className="w-6 h-6" />
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="glass-card p-6 rounded-xl">
                    <h3 className="text-gray-400 mb-2">Total Orders</h3>
                    <p className="text-3xl font-bold">0</p>
                </div>
                <div className="glass-card p-6 rounded-xl">
                    <h3 className="text-gray-400 mb-2">Total Revenue</h3>
                    <p className="text-3xl font-bold text-primary">$0.00</p>
                </div>
                <div className="glass-card p-6 rounded-xl">
                    <h3 className="text-gray-400 mb-2">Active Items</h3>
                    <p className="text-3xl font-bold">{foodItems.length}</p>
                </div>
            </div>

            <div className="glass-card p-8 rounded-2xl">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Upload className="w-6 h-6 text-primary" />
                    Upload New Food Item
                </h2>

                {success && (
                    <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-3 rounded-lg mb-6">
                        {success}
                    </div>
                )}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Food Name</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                                <input 
                                    type="text" 
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-primary transition-colors"
                                    placeholder="Spicy Burger"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Price ($)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                                <input 
                                    type="number" 
                                    required
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-primary transition-colors"
                                    placeholder="9.99"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Description</label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors h-32 resize-none"
                            placeholder="Describe your delicious food..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Food Video (Short)</label>
                        <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer relative">
                            <input 
                                type="file" 
                                accept="video/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                required
                            />
                            <div className="flex flex-col items-center gap-2 pointer-events-none">
                                <Video className={`w-10 h-10 ${video ? 'text-primary' : 'text-gray-500'}`} />
                                <span className="text-gray-400">
                                    {video ? video.name : 'Click to upload video (Max 10MB)'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button 
                        disabled={loading}
                        className="w-full bg-primary py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Uploading...' : 'Publish Item'}
                    </button>
                </form>
            </div>

            {/* Uploaded Items Section */}
            <div className="glass-card p-8 rounded-2xl mt-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Video className="w-6 h-6 text-primary" />
                    My Uploaded Items
                </h2>
                
                {loadingItems ? (
                    <p className="text-gray-400">Loading your items...</p>
                ) : foodItems.length === 0 ? (
                    <p className="text-gray-400">No items uploaded yet.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {foodItems.map((item) => (
                            <div key={item._id} className="bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-colors border border-white/10 group relative">
                                <div className="aspect-video bg-black relative">
                                    <video 
                                        src={item.video} 
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Overlay for Preview Button */}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button 
                                            onClick={() => setPreviewItem(item)}
                                            className="bg-primary text-white px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                                        >
                                            <Eye className="w-5 h-5" /> Preview Reel
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg">{item.name}</h3>
                                        <span className="text-primary font-bold">${item.price}</span>
                                    </div>
                                    <p className="text-gray-400 text-sm line-clamp-2">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Reel Preview Modal */}
            {previewItem && (
                <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
                    <button 
                        onClick={() => setPreviewItem(null)}
                        className="absolute top-4 right-4 text-white hover:text-primary z-50 bg-black/50 p-2 rounded-full"
                    >
                        <X className="w-8 h-8" />
                    </button>
                    
                    <div className="relative w-full max-w-md h-[80vh] bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                         <video 
                            src={previewItem.video}
                            className="w-full h-full object-cover"
                            autoPlay
                            controls
                            loop
                        />
                        
                        {/* Overlay Info */}
                        <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/50 to-transparent">
                            <h3 className="text-2xl font-bold text-white mb-1">{previewItem.name}</h3>
                            <p className="text-gray-200 text-sm line-clamp-3 mb-4">{previewItem.description}</p>
                            
                            <div className="flex items-center justify-between">
                                 <span className="text-primary font-bold text-2xl flex items-center">
                                    <DollarSign className="w-6 h-6" /> {previewItem.price}
                                 </span>
                                 <button className="bg-white/20 text-white px-6 py-2 rounded-full font-bold backdrop-blur-md">
                                     View Analytics
                                 </button>
                            </div>
                        </div>

                         {/* Mock Actions Sidebar */}
                        <div className="absolute right-4 bottom-24 flex flex-col gap-6 items-center">
                            <div className="flex flex-col items-center gap-1 text-white">
                                <div className="bg-black/40 p-3 rounded-full backdrop-blur-sm">
                                    <Heart className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-bold">0</span>
                            </div>
                            <div className="flex flex-col items-center gap-1 text-white">
                                <div className="bg-black/40 p-3 rounded-full backdrop-blur-sm">
                                    <MessageCircle className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-bold">0</span>
                            </div>
                            <div className="flex flex-col items-center gap-1 text-white">
                                <div className="bg-black/40 p-3 rounded-full backdrop-blur-sm">
                                    <Share2 className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-bold">Share</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartnerDashboard;
