import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import PartnerDashboard from './pages/PartnerDashboard';
import UserFeed from './pages/UserFeed';
import Navbar from './components/layout/Navbar';
import CartSidebar from './components/layout/CartSidebar';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

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
            <Route path="/partner/dashboard" element={<PartnerDashboard />} />
            <Route path="/feed" element={<UserFeed />} />
          </Routes>
        </main>
      </div>
      </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
