import { useState } from 'react';
import { Link } from 'react-router';
import { Building2, MapPin, Rocket, Search, User, Wifi } from 'lucide-react';
import { OPEN_TO, OPPORTUNITY_TYPES, type Opportunity } from '@wrx/shared';
import { useT } from '@/lib/i18n';
import { relTime } from '@/lib/format';
import { useDiscover, usePublicOpportunities, type DirectoryProfile } from '@/hooks/queries';
import { Badge, Empty, Input, ModuleLoader, Segmented, Select, cx } from '@/components/ui';

export const kindIcon = { person: User, startup: Rocket, company: Building2 } as const;
export const useKindLabel = () => {
  const { t } = useT();
  return { person: t('Person'), startup: t('Startup'), company: t('Company') } as const;
};
export const useOpenToLabel = () => {
  const { t } = useT();
  return {
    hiring: t('Hiring'),
    jobs: t('Open to jobs'),
    internships: t('Internships'),
    freelance: t('Freelance'),
    cofounder: t('Looking for a co-founder'),
    partnerships: t('Partnerships'),
    investment: t('Investment'),
    mentoring: t('Mentoring'),
  } as Record<(typeof OPEN_TO)[number], string>;
};
export const useOppTypeLabel = () => {
  const { t } = useT();
  return {
    job: t('Job'),
    internship: t('Internship'),
    freelance: t('Freelance mission'),
    cofounder: t('Co-founder'),
    partnership: t('Partnership'),
    investment: t('Funding'),
  } as Record<(typeof OPPORTUNITY_TYPES)[number], string>;
};

export function Avatar({
  src,
  name,
  size = 48,
  kind,
}: {
  src?: string | null;
  name: string;
  size?: number;
  kind?: keyof typeof kindIcon;
}) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return src ? (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={cx('shrink-0 object-cover', kind === 'person' ? 'rounded-full' : 'rounded-xl')}
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className={cx(
        'grid shrink-0 place-items-center bg-raised font-semibold text-fg ring-1 ring-line',
        kind === 'person' ? 'rounded-full' : 'rounded-xl',
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function ProfileTile({ p }: { p: DirectoryProfile }) {
  const kinds = useKindLabel();
  const open = useOpenToLabel();
  const { t } = useT();
  const Icon = kindIcon[p.kind];
  return (
    <Link
      to={`/b/${p.handle}`}
      className="card group grid content-start gap-3 p-5 transition hover:border-accent/50 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="flex items-start gap-3">
        <Avatar src={p.avatar} name={p.title} kind={p.kind} />
        <div className="min-w-0">
          <h3 className="truncate text-[16px] font-semibold group-hover:text-accent">{p.title}</h3>
          <p className="line-clamp-2 text-[13.5px] text-muted">{p.headline}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 text-[12.5px] text-muted">
        <span className="inline-flex items-center gap-1">
          <Icon className="size-3.5" />
          {kinds[p.kind]}
        </span>
        {p.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" />
            {p.location}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {p.openTo.slice(0, 3).map((o) => (
          <Badge key={o} tone={o === 'hiring' || o === 'investment' ? 'signal' : 'route'}>
            {open[o]}
          </Badge>
        ))}
        {!!p.openOpportunities && <Badge tone="mint">{t('{n} open', { n: p.openOpportunities })}</Badge>}
      </div>
    </Link>
  );
}

export function OpportunityRow({ o }: { o: Opportunity }) {
  const types = useOppTypeLabel();
  const { t, lang } = useT();
  return (
    <Link
      to={`/o/${o.id}`}
      className="card group flex flex-wrap items-center gap-4 p-4 transition hover:border-accent/50"
    >
      <Avatar src={o.publisher.avatar} name={o.publisher.title} kind={o.publisher.kind} size={44} />
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold group-hover:text-accent">{o.title}</h3>
        <p className="text-[13.5px] text-muted">
          {o.publisher.title}
          {o.location && ` — ${o.location}`}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={o.type === 'investment' || o.type === 'cofounder' ? 'signal' : 'route'}>
          {types[o.type]}
        </Badge>
        {o.remote && (
          <Badge>
            <Wifi className="size-3" />
            {t('Remote')}
          </Badge>
        )}
        <span className="text-[12.5px] text-faint">{relTime(o.createdAt, lang)}</span>
      </div>
    </Link>
  );
}

export default function Discover() {
  const { t } = useT();
  const open = useOpenToLabel();
  const types = useOppTypeLabel();
  const [tab, setTab] = useState<'profiles' | 'opportunities'>('profiles');
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('');
  const [openTo, setOpenTo] = useState('');
  const [type, setType] = useState('');
  const profiles = useDiscover({ q, kind, openTo });
  const opps = usePublicOpportunities({ q, type });
  const list = tab === 'profiles' ? profiles : opps;

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-12 sm:px-8">
      <div className="mb-8 grid max-w-[64ch] gap-3">
        <h1 className="text-[40px] font-semibold">{t('Meet the people building things.')}</h1>
        <p className="text-muted">
          {t(
            'Find developers, designers and founders, startups looking for co-founders or funding, and companies that are hiring. Send an introduction in one message.',
          )}
        </p>
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Segmented
          label={t('Show')}
          value={tab}
          onChange={setTab}
          options={[
            { value: 'profiles', label: t('Profiles') },
            { value: 'opportunities', label: t('Opportunities') },
          ]}
        />
        <div className="min-w-[220px] flex-1">
          <Input
            leading={<Search className="size-4" />}
            placeholder={tab === 'profiles' ? t('Skill, industry, name…') : t('Role, technology, company…')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label={t('Search')}
          />
        </div>
        {tab === 'profiles' ? (
          <>
            <Select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              aria-label={t('Type')}
              className="w-auto"
            >
              <option value="">{t('Everyone')}</option>
              <option value="person">{t('People')}</option>
              <option value="startup">{t('Startups')}</option>
              <option value="company">{t('Companies')}</option>
            </Select>
            <Select
              value={openTo}
              onChange={(e) => setOpenTo(e.target.value)}
              aria-label={t('Open to')}
              className="w-auto"
            >
              <option value="">{t('Open to anything')}</option>
              {OPEN_TO.map((o) => (
                <option key={o} value={o}>
                  {open[o]}
                </option>
              ))}
            </Select>
          </>
        ) : (
          <Select
            value={type}
            onChange={(e) => setType(e.target.value)}
            aria-label={t('Type')}
            className="w-auto"
          >
            <option value="">{t('All opportunities')}</option>
            {OPPORTUNITY_TYPES.map((o) => (
              <option key={o} value={o}>
                {types[o]}
              </option>
            ))}
          </Select>
        )}
      </div>
      {list.isPending ? (
        <ModuleLoader />
      ) : tab === 'profiles' ? (
        profiles.data?.items.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.data.items.map((p) => (
              <ProfileTile key={p.handle} p={p} />
            ))}
          </div>
        ) : (
          <Empty
            title={t('No profiles match yet')}
            body={t('Try a broader search, or publish your own profile so others can find you.')}
          />
        )
      ) : opps.data?.items.length ? (
        <div className="grid gap-3">
          {opps.data.items.map((o) => (
            <OpportunityRow key={o.id} o={o} />
          ))}
        </div>
      ) : (
        <Empty
          title={t('No open opportunities match')}
          body={t('Clear the filters to see everything that is open right now.')}
        />
      )}
    </main>
  );
}
