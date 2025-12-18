import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in (could verify token or check local storage)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password, role) => {
        try {
            const endpoint = role === 'partner' ? '/foodpartner/login' : '/user/login';
            const { data } = await api.post(endpoint, { email, password });
            
            // Backend should return user info. For now, we mock/adapt:
            const userData = { ...data, role };
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
            await api.post(endpoint, { name, email, password });
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
