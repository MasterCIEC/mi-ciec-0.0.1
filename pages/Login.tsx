
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import Spinner from '../components/ui/Spinner';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
        }
        
        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-ciec-bg">
            <div className="w-full max-w-md p-8 space-y-8 bg-ciec-card rounded-lg shadow-lg">
                <div className="text-center">
                    <img src="https://flajemusminumtluybwr.supabase.co/storage/v1/object/public/assets/logos/logo_png.png" alt="CIEC Logo" className="mx-auto mb-4 h-24 w-auto object-contain" />
                    <h1 className="text-2xl font-bold text-ciec-text-primary">Mapa Industrial</h1>
                    <p className="text-ciec-text-secondary">Acceso al sistema</p>
                </div>
                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-ciec-text-secondary">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            tabIndex={1}
                            className="w-full mt-1 bg-ciec-bg border border-ciec-border rounded-lg px-3 py-2 text-ciec-text-primary focus:ring-2 focus:ring-ciec-blue focus:outline-none"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-ciec-text-secondary">Contraseña</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            tabIndex={2}
                            className="w-full mt-1 bg-ciec-bg border border-ciec-border rounded-lg px-3 py-2 text-ciec-text-primary focus:ring-2 focus:ring-ciec-blue focus:outline-none"
                        />
                    </div>
                    
                    {error && <p className="text-sm text-red-500 bg-red-900/30 p-3 rounded-md">{error}</p>}
                    
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            tabIndex={3}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ciec-blue hover:bg-ciec-blue-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ciec-blue disabled:opacity-50"
                        >
                            {loading ? <Spinner size="sm" color="border-white" /> : 'Iniciar Sesión'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
