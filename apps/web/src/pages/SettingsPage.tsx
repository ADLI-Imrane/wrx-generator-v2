import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { useProfile, useUpdateProfile, useUpdatePassword, useLogout } from '../hooks/useAuth';
import { useSubscription, useUsage } from '../hooks/useBilling';
import { supabase } from '../lib/supabase';
import type { UserProfileUpdate } from '@wrx/shared';
import {
  User,
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

type ProfileForm = Omit<UserProfileUpdate, 'avatarPath' | 'companyLogoPath'>;

const emptyProfileForm: ProfileForm = {
  fullName: '', jobTitle: '', company: '', phone: '', website: '', address: '',
  linkedinUrl: '', githubUrl: '', instagramUrl: '', xUrl: '',
  primaryBrandColor: '', secondaryBrandColor: '',
};

function ProfileField({
  id, label, value, onChange, type = 'text', maxLength, placeholder, autoComplete,
}: {
  id: string; label: string; value: string; onChange: (value: string) => void;
  type?: string; maxLength?: number; placeholder?: string; autoComplete?: string;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="input w-full"
      />
    </div>
  );
}

function ProfileImageField({
  id, label, url, busy, disabled, onChange,
}: {
  id: string; label: string; url?: string; busy: boolean; disabled: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-50">
        {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <User size={22} className="text-gray-400" aria-hidden="true" />}
      </div>
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="mb-2 block text-sm font-medium text-gray-800">{label}</label>
        <input
          id={id}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onChange}
          disabled={busy || disabled}
          aria-describedby={`${id}-help`}
          className="block min-h-11 max-w-full text-sm text-gray-700 file:mr-3 file:min-h-11 file:cursor-pointer file:rounded file:border-0 file:bg-gray-100 file:px-3 file:text-sm file:font-medium file:text-gray-800 hover:file:bg-gray-200 disabled:opacity-60"
        />
        <p id={`${id}-help`} className="mt-1 text-xs text-gray-500">PNG, JPEG ou WebP — 2 Mo maximum.</p>
        {busy && <span className="text-xs text-gray-500" role="status">Envoi de l’image…</span>}
      </div>
    </div>
  );
}

function ProfileColorField({
  id, label, value, onChange, onClear,
}: {
  id: string; label: string; value: string;
  onChange: (value: string) => void; onClear: () => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex min-h-12 items-center gap-3">
        <input
          id={id}
          type="color"
          value={value || '#FFFFFF'}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          aria-label={`${label} — choisir une couleur`}
          className="h-11 w-12 cursor-pointer rounded border border-gray-300 bg-white p-1"
        />
        <code className="text-sm text-gray-700">{value || 'Non définie'}</code>
        {value && <button type="button" onClick={onClear} className="ml-auto min-h-11 px-2 text-sm text-gray-600 underline">Effacer</button>}
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Billing data
  const { data: subscription, isLoading: isLoadingSubscription } = useSubscription();
  const { data: usage, isLoading: isLoadingUsage } = useUsage();
  const {
    data: profile,
    isLoading: isLoadingProfile,
    isError: isProfileError,
    refetch: refetchProfile,
  } = useProfile();
  const isProfileReady = !!user && profile?.id === user.id && !isLoadingProfile && !isProfileError;

  // Profile form
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    ...emptyProfileForm,
    fullName: profile?.fullName || '',
  });
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileImageError, setProfileImageError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<'avatar' | 'logo' | null>(null);

  useEffect(() => {
    if (!profile) return;
    setProfileForm({
      fullName: profile.fullName || '',
      jobTitle: profile.jobTitle || '',
      company: profile.company || '',
      phone: profile.phone || '',
      website: profile.website || '',
      address: profile.address || '',
      linkedinUrl: profile.linkedinUrl || '',
      githubUrl: profile.githubUrl || '',
      instagramUrl: profile.instagramUrl || '',
      xUrl: profile.xUrl || '',
      primaryBrandColor: profile.primaryBrandColor || '',
      secondaryBrandColor: profile.secondaryBrandColor || '',
    });
  }, [profile]);

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
    mutateAsync: updateProfileAsync,
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
      profileForm,
      {
        onSuccess: () => {
          setProfileSuccess(true);
          setTimeout(() => setProfileSuccess(false), 3000);
        },
      }
    );
  };

  const setProfileField = (key: keyof ProfileForm, value: string) => {
    setProfileForm((current) => ({ ...current, [key]: value }));
  };

  const handleProfileImage = async (
    event: React.ChangeEvent<HTMLInputElement>,
    kind: 'avatar' | 'logo',
  ) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    setProfileImageError(null);
    if (!user) {
      setProfileImageError('Connectez-vous pour modifier ces images.');
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setProfileImageError('Choisissez une image PNG, JPEG ou WebP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setProfileImageError('L’image ne doit pas dépasser 2 Mo.');
      return;
    }

    setUploadingImage(kind);
    try {
      const assetPath = `${user.id}/${kind === 'avatar' ? 'avatar' : 'company-logo'}`;
      const { error } = await supabase.storage.from('avatars').upload(assetPath, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: '3600',
      });
      if (error) throw error;

      await updateProfileAsync(kind === 'avatar' ? { avatarPath: assetPath } : { companyLogoPath: assetPath });
      setProfileSuccess(true);
      window.setTimeout(() => setProfileSuccess(false), 3000);
    } catch (error) {
      setProfileImageError(error instanceof Error ? error.message : 'Impossible d’envoyer cette image.');
    } finally {
      setUploadingImage(null);
    }
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
    <div className="settings-workspace space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="mt-1 text-gray-600">Gérez votre compte et vos préférences</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <div className="w-full lg:w-64">
          <nav className="settings-tabs card space-y-1 p-2" aria-label="Sections des paramètres">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={activeTab === tab.id}
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
                <h2 className="text-lg font-semibold text-gray-900">Profil et identité de marque</h2>
                <p className="text-sm text-gray-600">Une identité réutilisable dans vos futurs outils WRX.</p>
              </div>

              {profileSuccess && (
                <div role="status" className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-green-700">
                  <CheckCircle size={18} aria-hidden="true" />
                  <span className="text-sm">Profil mis à jour avec succès</span>
                </div>
              )}
              {(profileError || profileImageError) && (
                <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-red-700">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span className="text-sm">{profileImageError || (profileError as Error).message}</span>
                </div>
              )}
              {isLoadingProfile && <p role="status" className="text-sm text-gray-600">Chargement de votre profil…</p>}
              {isProfileError && (
                <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                  <span className="text-sm">Votre profil n’a pas pu être chargé. Réessayez avant d’enregistrer.</span>
                  <button type="button" onClick={() => void refetchProfile()} className="min-h-11 px-2 text-sm font-semibold underline">Réessayer</button>
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="settings-profile-form space-y-6">
                <fieldset className="space-y-4">
                  <legend className="mb-3 text-base font-semibold text-gray-900">Informations personnelles</legend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ProfileField id="profile-full-name" label="Nom complet" value={profileForm.fullName || ''} onChange={(value) => setProfileField('fullName', value)} maxLength={150} autoComplete="name" />
                    <div>
                      <label htmlFor="profile-email" className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                      <input id="profile-email" type="email" value={user?.email || ''} readOnly aria-describedby="profile-email-help" className="input w-full bg-gray-50" />
                      <p id="profile-email-help" className="mt-1 text-xs text-gray-500">Géré par votre compte d’authentification.</p>
                    </div>
                    <ProfileField id="profile-phone" label="Téléphone" type="tel" value={profileForm.phone || ''} onChange={(value) => setProfileField('phone', value)} maxLength={32} autoComplete="tel" placeholder="+212 …" />
                    <ProfileField id="profile-address" label="Adresse" value={profileForm.address || ''} onChange={(value) => setProfileField('address', value)} maxLength={300} autoComplete="street-address" />
                  </div>
                </fieldset>

                <fieldset className="space-y-4 border-t border-gray-200 pt-5">
                  <legend className="mb-3 text-base font-semibold text-gray-900">Informations professionnelles</legend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ProfileField id="profile-job-title" label="Fonction" value={profileForm.jobTitle || ''} onChange={(value) => setProfileField('jobTitle', value)} maxLength={120} autoComplete="organization-title" />
                    <ProfileField id="profile-company" label="Entreprise" value={profileForm.company || ''} onChange={(value) => setProfileField('company', value)} maxLength={150} autoComplete="organization" />
                    <div className="sm:col-span-2">
                      <ProfileField id="profile-website" label="Site web" value={profileForm.website || ''} onChange={(value) => setProfileField('website', value)} maxLength={500} autoComplete="url" placeholder="https://exemple.com" />
                    </div>
                  </div>
                </fieldset>

                <fieldset className="space-y-4 border-t border-gray-200 pt-5">
                  <legend className="mb-3 text-base font-semibold text-gray-900">Liens sociaux</legend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ProfileField id="profile-linkedin" label="LinkedIn" value={profileForm.linkedinUrl || ''} onChange={(value) => setProfileField('linkedinUrl', value)} maxLength={500} placeholder="https://linkedin.com/in/…" />
                    <ProfileField id="profile-github" label="GitHub" value={profileForm.githubUrl || ''} onChange={(value) => setProfileField('githubUrl', value)} maxLength={500} placeholder="https://github.com/…" />
                    <ProfileField id="profile-instagram" label="Instagram" value={profileForm.instagramUrl || ''} onChange={(value) => setProfileField('instagramUrl', value)} maxLength={500} placeholder="https://instagram.com/…" />
                    <ProfileField id="profile-x" label="X / Twitter" value={profileForm.xUrl || ''} onChange={(value) => setProfileField('xUrl', value)} maxLength={500} placeholder="https://x.com/…" />
                  </div>
                </fieldset>

                <fieldset className="space-y-4 border-t border-gray-200 pt-5">
                  <legend className="mb-3 text-base font-semibold text-gray-900">Identité de marque</legend>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <ProfileImageField id="profile-avatar" label="Photo de profil" url={profile?.avatarUrl} busy={uploadingImage === 'avatar'} disabled={!isProfileReady} onChange={(event) => void handleProfileImage(event, 'avatar')} />
                    <ProfileImageField id="profile-company-logo" label="Logo de l’entreprise" url={profile?.companyLogoUrl} busy={uploadingImage === 'logo'} disabled={!isProfileReady} onChange={(event) => void handleProfileImage(event, 'logo')} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ProfileColorField id="profile-primary-color" label="Couleur principale" value={profileForm.primaryBrandColor || ''} onChange={(value) => setProfileField('primaryBrandColor', value)} onClear={() => setProfileField('primaryBrandColor', '')} />
                    <ProfileColorField id="profile-secondary-color" label="Couleur secondaire" value={profileForm.secondaryBrandColor || ''} onChange={(value) => setProfileField('secondaryBrandColor', value)} onClear={() => setProfileField('secondaryBrandColor', '')} />
                  </div>
                </fieldset>

                <div className="flex justify-end border-t border-gray-200 pt-5">
                  <button type="submit" disabled={!isProfileReady || isUpdatingProfile || uploadingImage !== null} className="btn btn-primary min-h-11">
                    {isUpdatingProfile ? 'Enregistrement…' : 'Enregistrer le profil'}
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
                      aria-label="Nouveau mot de passe"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="input w-full pl-10 pr-10"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
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
                      aria-label="Confirmer le mot de passe"
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
