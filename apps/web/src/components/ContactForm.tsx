import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CONTACT_INTENTS, type ContactInput } from '@wrx/shared';
import { api, ApiError } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { Button, Field, Input, Select, Textarea } from './ui';

export function ContactForm({
  handle,
  opportunityId,
  defaultIntent = 'collaboration',
  onSent,
}: {
  handle: string;
  opportunityId?: string;
  defaultIntent?: ContactInput['intent'];
  onSent?: () => void;
}) {
  const { t } = useT();
  const intents: Record<(typeof CONTACT_INTENTS)[number], string> = {
    collaboration: t('Collaboration'),
    hiring: t('I want to hire you'),
    job: t('Job application'),
    partnership: t('Partnership'),
    investment: t('Investment'),
    mentoring: t('Mentoring'),
    other: t('Something else'),
  };
  const [f, setF] = useState<ContactInput>({
    intent: defaultIntent,
    name: '',
    email: '',
    company: '',
    profileUrl: '',
    message: '',
    website: '',
  });
  const m = useMutation({
    mutationFn: () => api(`/public/bio/${handle}/contact`, { method: 'POST', body: { ...f, opportunityId } }),
    onSuccess: () => onSent?.(),
  });
  const fields = m.error instanceof ApiError ? m.error.fields : {};
  const set =
    (k: keyof ContactInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setF({ ...f, [k]: e.target.value });

  if (m.isSuccess)
    return (
      <div className="grid justify-items-center gap-2 py-8 text-center">
        <span
          className="grid size-12 place-items-center rounded-full bg-mint/15 text-2xl text-mint"
          aria-hidden
        >
          ✓
        </span>
        <h3 className="text-lg font-semibold">{t('Message sent')}</h3>
        <p className="max-w-xs text-[14px] text-muted">
          {t('They will reply to the email address you gave. No account needed on your side.')}
        </p>
      </div>
    );
  return (
    <form
      className="grid gap-4"
      noValidate
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        m.mutate();
      }}
    >
      {!opportunityId && (
        <Field label={t('What is it about?')} htmlFor="intent">
          <Select id="intent" value={f.intent} onChange={set('intent')}>
            {CONTACT_INTENTS.map((i) => (
              <option key={i} value={i}>
                {intents[i]}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('Your name')} htmlFor="c-name" error={fields.name}>
          <Input
            id="c-name"
            autoComplete="name"
            value={f.name}
            onChange={set('name')}
            invalid={!!fields.name}
          />
        </Field>
        <Field label={t('Your email')} htmlFor="c-email" error={fields.email}>
          <Input
            id="c-email"
            type="email"
            autoComplete="email"
            value={f.email}
            onChange={set('email')}
            invalid={!!fields.email}
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('Company (optional)')} htmlFor="c-co">
          <Input id="c-co" autoComplete="organization" value={f.company} onChange={set('company')} />
        </Field>
        <Field label={t('Profile or portfolio link (optional)')} htmlFor="c-url" error={fields.profileUrl}>
          <Input
            id="c-url"
            type="url"
            placeholder="https://"
            value={f.profileUrl}
            onChange={set('profileUrl')}
          />
        </Field>
      </div>
      <Field label={t('Message')} htmlFor="c-msg" error={fields.message}>
        <Textarea
          id="c-msg"
          rows={5}
          value={f.message}
          onChange={set('message')}
          invalid={!!fields.message}
        />
      </Field>
      {/* Honeypot: hidden from people and assistive tech, irresistible to bots. */}
      <input
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute -left-[9999px] size-px opacity-0"
        name="website"
        value={f.website}
        onChange={set('website')}
      />
      {m.error && !Object.keys(fields).length && (
        <p role="alert" className="text-[13.5px] text-coral">
          {m.error.message}
        </p>
      )}
      <Button type="submit" size="lg" loading={m.isPending}>
        {opportunityId ? t('Send my application') : t('Send message')}
      </Button>
    </form>
  );
}
