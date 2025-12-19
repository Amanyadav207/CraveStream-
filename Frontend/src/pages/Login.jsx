import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';

const Login = () => {
    const location = useLocation();
    const [isPartner, setIsPartner] = useState(location.state?.isPartner || false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    // Update state if location state changes (e.g. back button)
    useEffect(() => {
        if (location.state?.isPartner !== undefined) {
             setIsPartner(location.state.isPartner);
        }
    }, [location.state]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const role = isPartner ? 'partner' : 'user';
        const result = await login(email, password, role);
        console.log(result);
        
        if (result.success) {
            navigate(isPartner ? '/partner/dashboard' : '/feed');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10">
            <div className="glass-card p-8 rounded-2xl">
                <h2 className="text-3xl font-bold mb-6 text-center">Welcome Back</h2>
                
                <div className="flex bg-black/20 p-1 rounded-lg mb-8">
                    <button 
                        className={`flex-1 py-2 rounded-md transition-all ${!isPartner ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => setIsPartner(false)}
                    >
                        User
                    </button>
                    <button 
                        className={`flex-1 py-2 rounded-md transition-all ${isPartner ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        onClick={() => setIsPartner(true)}
                    >
                        Partner
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg flex items-center gap-2 mb-4">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Email</label>
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors text-white"
                            placeholder="name@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Password</label>
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-primary transition-colors text-white"
                            placeholder="••••••••"
                        />
                    </div>
                    
                    <button className="w-full bg-primary py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors mt-4 text-white">
                        {isPartner ? 'Login as Partner' : 'Login as User'}
                    </button>
                </form>
                
                <p className="text-center text-gray-500 mt-6 text-sm">
                    Don't have an account? <Link to="/signup" state={{ isPartner }} className="text-primary cursor-pointer hover:underline">Sign up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
