import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useResetPassword } from '../hooks/useAuth';
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { AuthFrame } from '../components/AuthFrame';
import { BrandLogo } from '../components/BrandLogo';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { mutate: resetPassword, isPending, error } = useResetPassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetPassword(
      { email },
      {
        onSuccess: () => setIsSubmitted(true),
      }
    );
  };

  if (isSubmitted) {
    return (
      <AuthFrame>
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Email envoyé !</h2>
          <p className="text-gray-600">
            Si un compte existe avec l'adresse <strong>{email}</strong>, vous recevrez un email avec
            les instructions pour réinitialiser votre mot de passe.
          </p>
          <div className="pt-4">
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-2 font-medium"
            >
              <ArrowLeft size={18} />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame>
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <BrandLogo size="auth" className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Mot de passe oublié ?</h2>
          <p className="mt-2 text-gray-600">
            Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
        </div>

        {/* Erreur */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700">
            <AlertCircle size={20} />
            <span className="text-sm">{(error as Error).message}</span>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Adresse email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                className="input w-full pl-10"
              />
            </div>
          </div>

          <button type="submit" disabled={isPending} className="btn btn-primary w-full">
            {isPending ? 'Envoi en cours...' : 'Envoyer le lien'}
          </button>
        </form>

        <div className="text-center">
          <Link
            to="/login"
            className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Retour à la connexion
          </Link>
        </div>
      </div>
    </AuthFrame>
  );
}
