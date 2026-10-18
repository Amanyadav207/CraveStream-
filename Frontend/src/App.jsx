import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import PartnerDashboard from './pages/PartnerDashboard';
import UserFeed from './pages/UserFeed';
import Navbar from './components/layout/Navbar';
import CartSidebar from './components/layout/CartSidebar';

import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Send each role to its own page. The API enforces access (401/403) anyway;
// this only avoids showing an empty page for the wrong account type.
function RequireRole({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) {
    return <Navigate to={user.role === 'partner' ? '/partner/dashboard' : '/feed'} replace />;
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-dark text-white">
            <Navbar />
            <CartSidebar />
            <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/partner/dashboard" element={<RequireRole role="partner"><PartnerDashboard /></RequireRole>} />
            <Route path="/feed" element={<RequireRole role="user"><UserFeed /></RequireRole>} />
          </Routes>
        </main>
      </div>
      </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
