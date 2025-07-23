
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <h1 className="text-9xl font-black text-ciec-blue opacity-50">404</h1>
            <h2 className="text-3xl font-bold text-ciec-text mt-4">Página No Encontrada</h2>
            <p className="text-ciec-dark-gray mt-2">Lo sentimos, la página que busca no existe o ha sido movida.</p>
            <Link
                to="/dashboard"
                className="mt-8 bg-ciec-blue hover:bg-ciec-gold text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
                Volver al Dashboard
            </Link>
        </div>
    );
};

export default NotFound;
