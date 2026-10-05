import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Button, Field, Input } from '@/components/ui';
import { Logo } from '@/components/Logo';

const Frame = ({ children }: { children: React.ReactNode }) => (
  <main className="module-grid grid min-h-dvh place-items-center px-5">
    <div className="card grid w-full max-w-sm gap-5 p-7 shadow-[var(--shadow-lift)]">
      {children}
      <Link to="/" className="mx-auto text-faint">
        <Logo className="text-[15px]" />
      </Link>
    </div>
  </main>
);

export function Unlock() {
  const { slug = '' } = useParams();
  const { t } = useT();
  const [password, setPassword] = useState('');
  const m = useMutation({
    mutationFn: () => api<{ url: string }>(`/public/unlock/${slug}`, { method: 'POST', body: { password } }),
    onSuccess: (r) => window.location.replace(r.url),
  });
  const err = m.error instanceof ApiError ? (m.error.fields.password ?? m.error.message) : undefined;
  return (
    <Frame>
      <div className="grid justify-items-center gap-2 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent">
          <Lock className="size-5" />
        </span>
        <h1 className="text-[24px] font-semibold">{t('This link is protected')}</h1>
        <p className="text-[14px] text-muted">{t('Enter the password you were given to continue.')}</p>
      </div>
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          m.mutate();
        }}
      >
        <Field label={t('Password')} htmlFor="pw" error={err}>
          <Input
            id="pw"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            invalid={!!err}
          />
        </Field>
        <Button type="submit" loading={m.isPending}>
          {t('Continue')}
        </Button>
      </form>
    </Frame>
  );
}

export function Unavailable() {
  const [p] = useSearchParams();
  const { t } = useT();
  const reason = p.get('reason');
  const text =
    reason === 'expired'
      ? t('This link has expired.')
      : reason === 'limit'
        ? t('This link reached its maximum number of visits.')
        : t('This link has been turned off by its owner.');
  return (
    <Frame>
      <div className="grid gap-2 text-center">
        <p className="font-mono text-[13px] text-faint">/{p.get('slug')}</p>
        <h1 className="text-[24px] font-semibold">{text}</h1>
        <p className="text-[14px] text-muted">
          {t('If you expected it to work, ask the person who shared it for a new link.')}
        </p>
      </div>
    </Frame>
  );
}
