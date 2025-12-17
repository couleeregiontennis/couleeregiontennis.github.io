import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

export const ProtectedRoute = ({ children, requireAdmin, requireCaptain }) => {
  const { session, loading, userRole } = useAuth();

  if (loading) return <div className="loading-state">Loading...</div>;
  if (!session) return <Navigate to="/login" replace />;

  if (requireAdmin && !userRole?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireCaptain && !userRole?.isCaptain) {
    return <Navigate to="/" replace />;
  }

  return children;
};
