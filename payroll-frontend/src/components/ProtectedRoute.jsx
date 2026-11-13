import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user } = useAuth();

    // Check if user is authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Check if user has required role
    if (allowedRoles && user?.role) {
        const userRole = user.role.toLowerCase();
        const hasAccess = allowedRoles.some(role => role.toLowerCase() === userRole);

        if (!hasAccess) {
            // Redirect to unauthorized page or user's own dashboard
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
