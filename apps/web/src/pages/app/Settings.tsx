import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Trash2 } from 'lucide-react';
import type { ApiKey, User } from '@wrx/shared';
import { api, ApiError } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { relTime } from '@/lib/format';
import { toggleTheme, isDark } from '@/lib/theme';
import { useApiKeys, useMe } from '@/hooks/queries';
import { Button, CopyButton, Field, Input, PageHeader, Segmented, useToast } from '@/components/ui';

export default function Settings() {
  const { t, lang, setLang } = useT();
  const me = useMe();
  const qc = useQueryClient();
  const nav = useNavigate();
  const toast = useToast();
  const demo = me.data?.isDemo;
  const [name, setName] = useState(me.data?.name ?? '');
  const [pw, setPw] = useState({ current: '', next: '' });
  const [dark, setDark] = useState(isDark);
  const saveName = useMutation({
    mutationFn: () => api<User>('/auth/me', { method: 'PATCH', body: { name } }),
    onSuccess: (u) => {
      qc.setQueryData(['me'], u);
      toast(t('Name updated'));
    },
  });
  const savePw = useMutation({
    mutationFn: () => api('/auth/password', { method: 'POST', body: pw }),
    onSuccess: () => {
      setPw({ current: '', next: '' });
      toast(t('Password changed'));
    },
  });
  const del = useMutation({
    mutationFn: () => api('/auth/me', { method: 'DELETE' }),
    onSuccess: () => {
      qc.clear();
      nav('/');
    },
  });
  const pwFields = savePw.error instanceof ApiError ? savePw.error.fields : {};

  return (
    <>
      <PageHeader title={t('Settings')} />
      <div className="grid max-w-3xl gap-6">
        <section className="card grid gap-4 p-5">
          <h2 className="text-[16px] font-semibold">{t('Account')}</h2>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              saveName.mutate();
            }}
          >
            <Field label={t('Name')} htmlFor="s-name" className="min-w-[220px] flex-1">
              <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} disabled={demo} />
            </Field>
            <Button
              type="submit"
              variant="secondary"
              loading={saveName.isPending}
              disabled={demo || name === me.data?.name}
            >
              {t('Save')}
            </Button>
          </form>
          <p className="text-[13.5px] text-muted">
            {t('Signed in as {email}.', { email: me.data?.email ?? '' })}
          </p>
        </section>

        <section className="card grid gap-4 p-5">
          <h2 className="text-[16px] font-semibold">{t('Appearance and language')}</h2>
          <div className="flex flex-wrap gap-6">
            <Segmented
              label={t('Theme')}
              value={dark ? 'dark' : 'light'}
              onChange={(v) => {
                if ((v === 'dark') !== dark) setDark(toggleTheme());
              }}
              options={[
                { value: 'light', label: t('Light') },
                { value: 'dark', label: t('Dark') },
              ]}
            />
            <Segmented
              label={t('Language')}
              value={lang}
              onChange={setLang}
              options={[
                { value: 'en', label: 'English' },
                { value: 'fr', label: 'Français' },
              ]}
            />
          </div>
        </section>

        <ApiKeys disabled={demo} />

        {!demo && (
          <>
            <section className="card grid gap-4 p-5">
              <h2 className="text-[16px] font-semibold">{t('Password')}</h2>
              <form
                className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
                onSubmit={(e) => {
                  e.preventDefault();
                  savePw.mutate();
                }}
              >
                <Field label={t('Current password')} htmlFor="pw-c" error={pwFields.current}>
                  <Input
                    id="pw-c"
                    type="password"
                    autoComplete="current-password"
                    value={pw.current}
                    onChange={(e) => setPw({ ...pw, current: e.target.value })}
                  />
                </Field>
                <Field label={t('New password')} htmlFor="pw-n" error={pwFields.next}>
                  <Input
                    id="pw-n"
                    type="password"
                    autoComplete="new-password"
                    value={pw.next}
                    onChange={(e) => setPw({ ...pw, next: e.target.value })}
                  />
                </Field>
                <Button type="submit" variant="secondary" loading={savePw.isPending}>
                  {t('Change')}
                </Button>
              </form>
            </section>
            <section className="grid gap-3 rounded-[var(--radius-card)] border border-coral/40 p-5">
              <h2 className="text-[16px] font-semibold text-coral">{t('Delete account')}</h2>
              <p className="text-[14px] text-muted">
                {t(
                  'Deletes your links, QR codes, profiles, opportunities and messages. Short links stop working immediately.',
                )}
              </p>
              <Button
                variant="danger"
                className="justify-self-start"
                loading={del.isPending}
                onClick={() =>
                  confirm(t('Delete your account and everything in it? This cannot be undone.')) &&
                  del.mutate()
                }
              >
                {t('Delete my account')}
              </Button>
            </section>
          </>
        )}
      </div>
    </>
  );
}

function ApiKeys({ disabled }: { disabled?: boolean }) {
  const { t, lang } = useT();
  const qc = useQueryClient();
  const keys = useApiKeys();
  const [name, setName] = useState('');
  const [secret, setSecret] = useState<string | null>(null);
  const create = useMutation({
    mutationFn: () => api<ApiKey & { secret: string }>('/keys', { method: 'POST', body: { name } }),
    onSuccess: (k) => {
      setSecret(k.secret);
      setName('');
      qc.invalidateQueries({ queryKey: ['keys'] });
    },
  });
  const revoke = useMutation({
    mutationFn: (id: string) => api(`/keys/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['keys'] }),
  });
  return (
    <section className="card grid gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[16px] font-semibold">{t('API keys')}</h2>
        <a href="/api/v1/docs" className="text-[13.5px] font-medium text-accent">
          {t('API reference')}
        </a>
      </div>
      <p className="-mt-2 text-[13.5px] text-muted">
        {t('Use a key to create links and read analytics from your own code: Authorization: Bearer wrx_…')}
      </p>
      {secret && (
        <div className="grid gap-2 rounded-xl border border-signal bg-signal/10 p-4">
          <p className="text-[13.5px] font-medium">
            {t('Copy this key now. For your security it will not be shown again.')}
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-surface px-3 py-2 font-mono text-[13px]">
              {secret}
            </code>
            <CopyButton value={secret} />
          </div>
        </div>
      )}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <Input
          placeholder={t('Key name, e.g. Zapier')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label={t('Key name')}
          disabled={disabled}
        />
        <Button type="submit" loading={create.isPending} disabled={!name || disabled}>
          <KeyRound className="size-4" />
          {t('Create key')}
        </Button>
      </form>
      {disabled && (
        <p className="text-[13px] text-faint">{t('API keys are disabled in the demo workspace.')}</p>
      )}
      {!!keys.data?.items.length && (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {keys.data.items.map((k) => (
            <li key={k.id} className="flex items-center gap-3 px-4 py-3 text-[14px]">
              <span className="font-medium">{k.name}</span>
              <code className="font-mono text-[12.5px] text-muted">{k.prefix}…</code>
              <span className="ml-auto text-[12.5px] text-faint">
                {k.lastUsedAt ? t('Used {when}', { when: relTime(k.lastUsedAt, lang) }) : t('Never used')}
              </span>
              <button
                className="grid size-8 place-items-center rounded-lg text-muted hover:text-coral"
                aria-label={t('Revoke key')}
                onClick={() =>
                  confirm(t('Revoke this key? Apps using it will stop working.')) && revoke.mutate(k.id)
                }
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
