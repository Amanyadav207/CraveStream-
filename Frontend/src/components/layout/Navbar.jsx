import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, User, ShoppingBag, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartCount, toggleCart } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
      logout();
      navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <UtensilsCrossed className="text-white w-5 h-5" />
            </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
            Zomato
          </span>
        </Link>
        
        <div className="flex items-center gap-6">
          {user ? (
              <>
                <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    <span className="hidden md:inline font-medium">{user.name}</span>
                </div>
                <button onClick={handleLogout} className="text-gray-400 hover:text-white transition-colors" title="Logout">
                    <LogOut className="w-5 h-5" />
                </button>
              </>
          ) : (
            <Link to="/login" className="flex items-center gap-2 hover:text-primary transition-colors">
                <User className="w-5 h-5" />
                <span className="hidden md:inline">Login</span>
            </Link>
          )}
          
          <div onClick={toggleCart} className="relative cursor-pointer hover:text-primary transition-colors">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-primary rounded-full text-[10px] flex items-center justify-center font-bold">{cartCount}</span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
