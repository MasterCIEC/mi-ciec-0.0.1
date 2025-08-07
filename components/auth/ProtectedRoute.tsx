
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Profile } from '../../types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    role: Profile['role'];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
    const { profile } = useAuth();

    if (profile?.role !== role) {
        // Redirect them to the home page if they are not the correct role.
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
