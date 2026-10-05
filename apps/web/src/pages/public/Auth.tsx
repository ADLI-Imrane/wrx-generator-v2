import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { User } from '@wrx/shared';
import { api, ApiError } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Button, Field, Input } from '@/components/ui';
import { Logo } from '@/components/Logo';
import { useDemoLogin } from '@/hooks/useDemoLogin';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { t } = useT();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const qc = useQueryClient();
  const demo = useDemoLogin();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const m = useMutation({
    mutationFn: () =>
      api<User>(`/auth/${mode}`, {
        method: 'POST',
        body: mode === 'login' ? { email: form.email, password: form.password } : form,
      }),
    onSuccess: (u) => {
      qc.clear();
      qc.setQueryData(['me'], u);
      nav(params.get('next') || '/app');
    },
  });
  const fields = m.error instanceof ApiError ? m.error.fields : {};
  const submit = (e: FormEvent) => {
    e.preventDefault();
    m.mutate();
  };
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link to="/" aria-label="WRX home">
          <Logo />
        </Link>
        <form onSubmit={submit} className="m-auto grid w-full max-w-sm gap-5 py-12" noValidate>
          <div className="grid gap-2">
            <h1 className="text-[32px] font-semibold">
              {mode === 'login' ? t('Welcome back') : t('Create your account')}
            </h1>
            <p className="text-muted">
              {mode === 'login'
                ? t('Sign in to your links, QR codes and inbox.')
                : t('Free forever for personal use. No card needed.')}
            </p>
          </div>
          {mode === 'register' && (
            <Field label={t('Full name')} htmlFor="name" error={fields.name}>
              <Input
                id="name"
                autoComplete="name"
                value={form.name}
                onChange={set('name')}
                invalid={!!fields.name}
                required
              />
            </Field>
          )}
          <Field label={t('Email')} htmlFor="email" error={fields.email}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={set('email')}
              invalid={!!fields.email}
              required
            />
          </Field>
          <Field
            label={t('Password')}
            htmlFor="password"
            error={fields.password}
            hint={mode === 'register' ? t('At least 8 characters.') : undefined}
          >
            <Input
              id="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={form.password}
              onChange={set('password')}
              invalid={!!fields.password}
              required
            />
          </Field>
          {m.error && !Object.keys(fields).length && (
            <p role="alert" className="rounded-lg bg-coral/10 px-3 py-2 text-[13.5px] text-coral">
              {m.error.message}
            </p>
          )}
          <Button type="submit" size="lg" loading={m.isPending}>
            {mode === 'login' ? t('Sign in') : t('Create account')}
          </Button>
          <Button
            type="button"
            size="lg"
            variant="secondary"
            loading={demo.isPending}
            onClick={() => demo.mutate()}
          >
            {t('Explore the demo instead')}
          </Button>
          <p className="text-center text-[14px] text-muted">
            {mode === 'login' ? (
              <>
                {t('New to WRX?')}{' '}
                <Link className="font-medium text-accent" to="/register">
                  {t('Create an account')}
                </Link>
              </>
            ) : (
              <>
                {t('Already have an account?')}{' '}
                <Link className="font-medium text-accent" to="/login">
                  {t('Sign in')}
                </Link>
              </>
            )}
          </p>
        </form>
      </div>
      <aside className="module-grid relative hidden overflow-hidden bg-ink lg:block" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(58,91,255,.55),transparent_55%),radial-gradient(circle_at_80%_90%,rgba(255,183,3,.35),transparent_50%)]" />
        <div className="relative flex h-full flex-col justify-end gap-4 p-14 text-white">
          <p className="max-w-md font-display text-[30px] font-semibold leading-tight">
            {t('Print a QR code once. Change where it points whenever you like.')}
          </p>
          <p className="text-white/60">
            {t(
              'Every WRX QR code is dynamic: it encodes a short link, so menus, posters and business cards never need reprinting.',
            )}
          </p>
        </div>
      </aside>
    </div>
  );
}
