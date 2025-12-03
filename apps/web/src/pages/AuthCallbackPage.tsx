import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase gère automatiquement le callback OAuth via l'URL
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (data.session) {
          setStatus('success');
          // Rediriger vers le dashboard après un court délai
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1500);
        } else {
          throw new Error('Aucune session trouvée');
        }
      } catch (error) {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Une erreur est survenue');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="text-primary-600 mx-auto h-12 w-12 animate-spin" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Connexion en cours...</h2>
            <p className="mt-2 text-gray-600">
              Veuillez patienter pendant que nous vérifions votre identité.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Connexion réussie !</h2>
            <p className="mt-2 text-gray-600">Redirection vers votre tableau de bord...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Erreur de connexion</h2>
            <p className="mt-2 text-gray-600">{errorMessage}</p>
            <button onClick={() => navigate('/login')} className="btn btn-primary mt-6">
              Retour à la connexion
            </button>
          </>
        )}
      </div>
    </div>
  );
}
