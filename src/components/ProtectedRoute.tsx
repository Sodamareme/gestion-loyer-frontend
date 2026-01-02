
import { useEffect, useState } from 'react';
import { auth } from '../services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: ('admin' | 'locataire')[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const result = await auth.getCurrentUser();
      
      if (!result || !allowedRoles.includes(result.user.role)) {
        window.location.href = '/login';
        return;
      }
      
      setAuthorized(true);
    } catch (error) {
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return authorized ? <>{children}</> : null;
}