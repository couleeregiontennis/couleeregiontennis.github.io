import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

export const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth();

  if (loading) return <div className="loading-state">Loading...</div>;
  if (!session) return <Navigate to="/login" replace />;
  return children;
};
