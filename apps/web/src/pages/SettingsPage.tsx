import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { useUpdateProfile, useUpdatePassword, useLogout } from '../hooks/useAuth';
import { useSubscription, useUsage } from '../hooks/useBilling';
import {
  User,
  Mail,
  Lock,
  Bell,
  Trash2,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  LogOut,
  Shield,
  CreditCard,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Modal } from '../components/Modal';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'billing' | 'danger';

export function SettingsPage() {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Billing data
  const { data: subscription, isLoading: isLoadingSubscription } = useSubscription();
  const { data: usage, isLoading: isLoadingUsage } = useUsage();

  // Profile form
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password form
  const [_currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const {
    mutate: updateProfile,
    isPending: isUpdatingProfile,
    error: profileError,
  } = useUpdateProfile();
  const {
    mutate: updatePassword,
    isPending: isUpdatingPassword,
    error: updatePasswordError,
  } = useUpdatePassword();
  const { mutate: logout } = useLogout();

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(false);
    updateProfile(
      { fullName },
      {
        onSuccess: () => {
          setProfileSuccess(true);
          setTimeout(() => setProfileSuccess(false), 3000);
        },
      }
    );
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    updatePassword(
      { password: newPassword },
      {
        onSuccess: () => {
          setPasswordSuccess(true);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setTimeout(() => setPasswordSuccess(false), 3000);
        },
      }
    );
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmation === 'SUPPRIMER') {
      // TODO: Implement account deletion
      logout();
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Facturation', icon: CreditCard },
    { id: 'danger', label: 'Zone danger', icon: Trash2 },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="mt-1 text-gray-600">Gérez votre compte et vos préférences</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <div className="w-full lg:w-64">
          <nav className="card space-y-1 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={18} />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="card space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Informations du profil</h2>
                <p className="text-sm text-gray-600">Mettez à jour vos informations personnelles</p>
              </div>

              {profileSuccess && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-700">
                  <CheckCircle size={20} />
                  <span className="text-sm">Profil mis à jour avec succès</span>
                </div>
              )}

              {profileError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700">
                  <AlertCircle size={20} />
                  <span className="text-sm">{(profileError as Error).message}</span>
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Nom complet
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input w-full pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="input w-full bg-gray-50 pl-10"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">L'email ne peut pas être modifié</p>
                </div>

                <div className="flex justify-end">
                  <button type="submit" disabled={isUpdatingProfile} className="btn btn-primary">
                    {isUpdatingProfile ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="card space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Changer le mot de passe</h2>
                <p className="text-sm text-gray-600">
                  Mettez à jour votre mot de passe régulièrement pour sécuriser votre compte
                </p>
              </div>

              {passwordSuccess && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-700">
                  <CheckCircle size={20} />
                  <span className="text-sm">Mot de passe mis à jour avec succès</span>
                </div>
              )}

              {(passwordError || updatePasswordError) && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700">
                  <AlertCircle size={20} />
                  <span className="text-sm">
                    {passwordError || (updatePasswordError as Error)?.message}
                  </span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="input w-full pl-10"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="submit" disabled={isUpdatingPassword} className="btn btn-primary">
                    {isUpdatingPassword ? 'Modification...' : 'Modifier le mot de passe'}
                  </button>
                </div>
              </form>

              <hr />

              <div>
                <h3 className="font-medium text-gray-900">Déconnexion</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Déconnectez-vous de votre compte sur cet appareil
                </p>
                <button
                  onClick={() => logout()}
                  className="btn btn-outline mt-4 flex items-center gap-2"
                >
                  <LogOut size={18} />
                  Se déconnecter
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="card space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Préférences de notification</h2>
                <p className="text-sm text-gray-600">
                  Choisissez quelles notifications vous souhaitez recevoir
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    id: 'email_reports',
                    label: 'Rapports hebdomadaires',
                    description: 'Recevez un résumé de vos statistiques chaque semaine',
                  },
                  {
                    id: 'email_alerts',
                    label: 'Alertes de liens',
                    description: 'Soyez notifié quand un lien expire ou atteint un seuil de clics',
                  },
                  {
                    id: 'email_marketing',
                    label: 'Actualités et promotions',
                    description: 'Recevez des informations sur les nouvelles fonctionnalités',
                  },
                ].map((notification) => (
                  <label
                    key={notification.id}
                    className="flex items-start gap-4 rounded-lg border border-gray-200 p-4"
                  >
                    <input
                      type="checkbox"
                      defaultChecked={notification.id !== 'email_marketing'}
                      className="text-primary-600 mt-1 rounded border-gray-300"
                    />
                    <div>
                      <span className="font-medium text-gray-900">{notification.label}</span>
                      <p className="text-sm text-gray-500">{notification.description}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex justify-end">
                <button className="btn btn-primary">Enregistrer</button>
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="card space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Plan et facturation</h2>
                <p className="text-sm text-gray-600">Gérez votre abonnement et vos paiements</p>
              </div>

              {isLoadingSubscription ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="text-primary-600 h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                          subscription?.tier === 'business'
                            ? 'bg-purple-100 text-purple-700'
                            : subscription?.tier === 'pro'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {subscription?.tier === 'business'
                          ? 'Plan Business'
                          : subscription?.tier === 'pro'
                            ? 'Plan Pro'
                            : 'Plan Gratuit'}
                      </span>
                      <p className="mt-2 text-gray-600">
                        {subscription?.plan?.limits ? (
                          <>
                            {subscription.plan.limits.links === -1
                              ? 'Liens illimités'
                              : `${subscription.plan.limits.links} liens`}
                            {' et '}
                            {subscription.plan.limits.qrCodes === -1
                              ? 'QR codes illimités'
                              : `${subscription.plan.limits.qrCodes} QR codes`}
                            {' par mois'}
                          </>
                        ) : (
                          '10 liens et 5 QR codes par mois'
                        )}
                      </p>
                      {subscription?.currentPeriodEnd && subscription.tier !== 'free' && (
                        <p className="mt-1 text-xs text-gray-500">
                          {subscription.cancelAtPeriodEnd
                            ? `Se termine le ${new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}`
                            : subscription.scheduledDowngrade
                              ? `Passage au plan ${subscription.scheduledDowngrade.tier === 'pro' ? 'Pro' : subscription.scheduledDowngrade.tier} le ${new Date(subscription.scheduledDowngrade.date).toLocaleDateString('fr-FR')}`
                              : `Prochain renouvellement: ${new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}`}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => navigate('/billing')}
                      className="btn btn-primary flex items-center gap-2"
                    >
                      {subscription?.tier === 'free' ? 'Passer à Pro' : "Gérer l'abonnement"}
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>
              )}

              <div>
                <h3 className="mb-4 font-medium text-gray-900">Utilisation ce mois</h3>
                {isLoadingUsage ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Liens créés</span>
                        <span className="font-medium">
                          {usage?.links?.used ?? 0} /{' '}
                          {usage?.links?.limit === -1 ? '∞' : (usage?.links?.limit ?? 10)}
                        </span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-gray-200">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(usage?.links?.percentage ?? 0, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">QR codes créés</span>
                        <span className="font-medium">
                          {usage?.qrCodes?.used ?? 0} /{' '}
                          {usage?.qrCodes?.limit === -1 ? '∞' : (usage?.qrCodes?.limit ?? 5)}
                        </span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-purple-600 transition-all"
                          style={{ width: `${Math.min(usage?.qrCodes?.percentage ?? 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <button
                  onClick={() => navigate('/billing')}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Voir l'historique de facturation →
                </button>
              </div>
            </div>
          )}

          {/* Danger Zone Tab */}
          {activeTab === 'danger' && (
            <div className="card space-y-6 border-red-200">
              <div>
                <h2 className="text-lg font-semibold text-red-600">Zone danger</h2>
                <p className="text-sm text-gray-600">
                  Actions irréversibles concernant votre compte
                </p>
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                <h3 className="font-medium text-red-800">Supprimer le compte</h3>
                <p className="mt-1 text-sm text-red-600">
                  Cette action est irréversible. Tous vos liens, QR codes et données seront
                  définitivement supprimés.
                </p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="btn mt-4 bg-red-600 text-white hover:bg-red-700"
                >
                  <Trash2 size={18} />
                  Supprimer mon compte
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmation('');
        }}
        title="Supprimer le compte"
        size="md"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-red-50 p-4 text-red-700">
            <p className="font-medium">⚠️ Cette action est irréversible</p>
            <p className="mt-1 text-sm">
              Tous vos liens, QR codes, statistiques et données personnelles seront supprimés
              définitivement.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Tapez <strong>SUPPRIMER</strong> pour confirmer
            </label>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="SUPPRIMER"
              className="input w-full"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmation('');
              }}
              className="btn btn-outline"
            >
              Annuler
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== 'SUPPRIMER'}
              className="btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              Supprimer définitivement
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
