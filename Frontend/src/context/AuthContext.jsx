import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifySession = async () => {
            try {
                // First check local storage for optimistic UI
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                     setUser(JSON.parse(storedUser));
                }

                // Call backend to verify cookie
                const { data } = await api.get('/verify');
                if (data.success) {
                    const userData = { ...(data.user || data.partner), role: data.role };
                    setUser(userData);
                    localStorage.setItem('user', JSON.stringify(userData));
                }
            } catch (error) {
                // If verification fails (401), clear everything
                console.log("Session verification failed", error);
                setUser(null);
                localStorage.removeItem('user');
                if (window.location.pathname !== '/login' && window.location.pathname !== '/' && window.location.pathname !== '/signup') {
                    // Optional: redirect to login if on a protected route
                     // window.location.href = '/login'; 
                }
            } finally {
                setLoading(false);
            }
        };

        verifySession();

        // Listen for 401 Unauthorized events from axios
        const handleLogout = () => {
            setUser(null);
            localStorage.removeItem('user');
            if (window.location.pathname !== '/login') {
                 window.location.href = '/login';
            }
        };

        window.addEventListener('auth:logout', handleLogout);

        return () => {
            window.removeEventListener('auth:logout', handleLogout);
        };
    }, []);

    const login = async (email, password, role) => {
        try {
            const endpoint = role === 'partner' ? '/foodpartner/login' : '/user/login';
            const { data } = await api.post(endpoint, { email, password });
            
            // Handle different response structures for user vs partner
            const userPayload = data.user || data.partner;
            const userData = { ...userPayload, role };
            
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            return { success: true };
        } catch (error) {
            console.error("Login failed", error);
            return { 
                success: false, 
                message: error.response?.data?.message || "Login failed" 
            };
        }
    };

    const register = async (name, email, password, role) => {
        try {
            const endpoint = role === 'partner' ? '/foodpartner/register' : '/user/register';
            const { data } = await api.post(endpoint, { name, email, password });
            
            // Handle different response structures for user vs partner
            const userPayload = data.user || data.partner;
            const userData = { ...userPayload, role };
            
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            
            return { success: true };
        } catch (error) {
           console.error("Register failed", error);
            return { 
                success: false, 
                message: error.response?.data?.message || "Registration failed" 
            };
        }
    };

    const logout = async () => {
        try {
            // Optional: Call logout endpoint if backend has it
             await api.post('/user/logout'); 
        } catch (e) {
            // ignore error
        } finally {
            setUser(null);
            localStorage.removeItem('user');
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
