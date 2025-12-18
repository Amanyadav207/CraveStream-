import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Discover the best 
            <span className="block text-primary">Food & Drinks</span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-10">
            From classy restaurants to quick bites, find everything you crave.
            Order online or book a table.
        </p>
        
        <div className="flex gap-4">
            <Link to={user ? (user.role === 'partner' ? "/partner/dashboard" : "/feed") : "/login"} className="bg-primary text-white px-8 py-3 rounded-full font-medium hover:bg-orange-600 transition-all flex items-center gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <button className="glass px-8 py-3 rounded-full font-medium hover:bg-white/10 transition-all">
                View Menu
            </button>
        </div>
    </div>
  );
};

export default Home;
