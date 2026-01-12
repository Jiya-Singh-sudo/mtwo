import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { JSX } from 'react';

type Props = {
  permission?: string;
  children: JSX.Element;
};

export default function ProtectedRoute({ permission, children }: Props) {
  const { isAuthenticated, hasPermission } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
