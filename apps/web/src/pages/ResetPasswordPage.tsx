import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUpdatePassword } from '../hooks/useAuth';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { mutate: updatePassword, isPending, error } = useUpdatePassword();

  // Vérifier si on a un token dans l'URL
  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const type = searchParams.get('type');

    if (!accessToken || type !== 'recovery') {
      // Pas de token valide, rediriger vers forgot-password
      navigate('/forgot-password', { replace: true });
    }
  }, [searchParams, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (password !== confirmPassword) {
      setValidationError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 8) {
      setValidationError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    updatePassword(
      { password },
      {
        onSuccess: () => {
          setIsSuccess(true);
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
        },
      }
    );
  };

  const displayError = validationError || (error as Error)?.message;

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Mot de passe modifié !</h2>
          <p className="text-gray-600">
            Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page
            de connexion.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="bg-primary-600 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl">
            <span className="text-xl font-bold text-white">W</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Nouveau mot de passe</h2>
          <p className="mt-2 text-gray-600">
            Choisissez un nouveau mot de passe sécurisé pour votre compte.
          </p>
        </div>

        {/* Erreur */}
        {displayError && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700">
            <AlertCircle size={20} />
            <span className="text-sm">{displayError}</span>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="input w-full pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">Minimum 8 caractères</p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="input w-full pl-10"
              />
            </div>
          </div>

          <button type="submit" disabled={isPending} className="btn btn-primary w-full">
            {isPending ? 'Modification...' : 'Modifier le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
