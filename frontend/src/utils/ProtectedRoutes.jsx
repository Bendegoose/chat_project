import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoutes() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <p>Betöltés...</p>;
    }

    return isAuthenticated ? <Outlet/> : <Navigate to="/login" replace />;
}
