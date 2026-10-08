import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, isLoading } = useAuthStore();
  const location = useLocation();

  // Afficher un loader pendant la vérification
  if (isLoading) {
    return (
      <div role="status" className="flex min-h-screen flex-col gap-5 items-center justify-center">
        <div className="border-primary-600 h-12 w-12 animate-spin rounded-full border-b-2"></div>
        <p className="eyebrow">Ouverture de votre espace…</p>
      </div>
    );
  }

  // Rediriger vers login si non authentifié
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
