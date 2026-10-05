import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, Contact, MessageSquare } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { AssemblingQr } from '@/components/AssemblingQr';
import { Badge, Button, cx } from '@/components/ui';
import { useDemoLogin } from '@/hooks/useDemoLogin';
import { useDiscover } from '@/hooks/queries';
import { ProfileTile } from '@/pages/public/Discover';
import { WorldMap } from '@/components/WorldMap';

/** Mounts children only once scrolled into view, so below-the-fold demos cost nothing up front. */
function WhenVisible({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && (setOn(true), io.disconnect()), { rootMargin: '120px' });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={className}>{on && children}</div>;
}

export default function Landing() {
  const { t } = useT();
  const demo = useDemoLogin();
  const people = useDiscover({});

  return (
    <main className="overflow-x-clip">
      {/* ------------------------------------------------ Hero */}
      <section className="relative">
        <div className="grid-lines pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" aria-hidden />
        <div className="pointer-events-none absolute left-1/2 top-[-220px] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-accent/25 blur-[120px] dark:bg-accent/20" aria-hidden />
        <div className="relative mx-auto grid max-w-[1120px] justify-items-center px-4 pb-10 pt-20 text-center sm:px-8 sm:pt-28">
          <Link to="/discover" className="group mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 py-1 pl-1 pr-3 text-[12.5px] text-muted shadow-[0_1px_2px_rgb(0_0_0/.04)] backdrop-blur hover:text-fg">
            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-white dark:text-[#0a0a0b]">{t('New')}</span>
            {t('Connect: profiles, opportunities and an inbox')}
            <ArrowUpRight className="size-3.5 transition group-hover:-translate-y-px group-hover:translate-x-px" />
          </Link>
          <h1 className="text-gradient max-w-[16ch] text-[46px] font-semibold leading-[1.02] tracking-[-0.045em] sm:text-[76px]">
            {t('Short links that know who is clicking.')}
          </h1>
          <p className="mt-6 max-w-[58ch] text-[16px] leading-relaxed text-muted sm:text-[18px]">
            {t('Shorten, route and track every link from the edge. Design QR codes that never need reprinting, and turn your profile into a card that collects introductions.')}
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link to="/register"><Button size="lg">{t('Start for free')}</Button></Link>
            <Button size="lg" variant="secondary" loading={demo.isPending} onClick={() => demo.mutate()}>{t('Explore the live demo')}</Button>
          </div>
          <p className="mt-4 text-[12.5px] text-faint">{t('No credit card. The demo opens a workspace full of sample data.')}</p>
        </div>

        {/* Product shot in a browser frame */}
        <div className="relative mx-auto max-w-[1200px] px-4 sm:px-8">
          <div className="relative rounded-[18px] border border-line bg-surface/70 p-2 shadow-[0_40px_120px_-40px_rgb(76_91_255/.35),var(--shadow-lift)] backdrop-blur">
            <div className="flex items-center gap-2 px-2 pb-2 pt-0.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-line-strong" /><span className="size-2.5 rounded-full bg-line-strong" /><span className="size-2.5 rounded-full bg-line-strong" />
              <span className="mx-auto rounded-md bg-raised px-16 py-1 text-[11px] text-faint">wrx.app/app</span>
            </div>
            <img src="/product-light.webp" alt={t('The WRX analytics dashboard')} width={2400} height={1500} className="block w-full rounded-[11px] border border-line dark:hidden" />
            <img src="/product-dark.webp" alt={t('The WRX analytics dashboard')} width={2400} height={1500} className="hidden w-full rounded-[11px] border border-line dark:block" />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg to-transparent" aria-hidden />
        </div>
      </section>

      {/* ------------------------------------------------ Bento */}
      <section id="features" className="mx-auto max-w-[1120px] scroll-mt-20 px-4 py-24 sm:px-8">
        <SectionTitle title={t('Everything a link needs. Nothing it does not.')} body={t('One link can route, protect, measure and print. Each feature below is live in the demo.')} />
        <div className="mt-12 grid gap-3 md:grid-cols-6">
          <Cell className="md:col-span-4" title={t('Route every visitor')} body={t('Phones, countries and A/B splits decide the destination at the edge, before the page starts loading.')}>
            <WhenVisible className="h-[230px]"><RoutingDemo /></WhenVisible>
          </Cell>
          <Cell className="md:col-span-2" title={t('Dynamic QR codes')} body={t('Colours, logo, frame. Change the destination after printing.')}>
            <WhenVisible className="grid h-[230px] place-items-center"><QrLoop /></WhenVisible>
          </Cell>
          <Cell className="md:col-span-2" title={t('Live analytics')} body={t('Clicks, unique visitors and QR scans as they happen.')}>
            <WhenVisible className="h-[200px]"><LiveCounter /></WhenVisible>
          </Cell>
          <Cell className="md:col-span-4" title={t('Global by default')} body={t('Country and city for every click, without storing a single IP address.')}>
            <WhenVisible className="relative h-[200px] overflow-hidden"><MapDemo /></WhenVisible>
          </Cell>
          <Cell className="md:col-span-3" title={t('An API for everything')} body={t('Create links and read analytics from your own code. Documented with OpenAPI.')}>
            <pre className="mt-1 overflow-x-auto rounded-[10px] border border-line bg-bg p-4 font-mono text-[12px] leading-[1.7] text-muted"><code>
              <span className="text-fg">POST</span> /api/v1/links{'\n'}
              Authorization: Bearer <span className="text-accent">wrx_…</span>{'\n\n'}
              {'{'} <span className="text-fg">"url"</span>: "https://example.com/launch",{'\n'}
              {'  '}<span className="text-fg">"slug"</span>: "launch" {'}'}{'\n\n'}
              <span className="text-mint">201 Created</span> → wrx.app/launch
            </code></pre>
          </Cell>
          <Cell className="md:col-span-3" title={t('A card that opens doors')} body={t('A public profile, a QR business card and a contact form in one.')}>
            <div className="mt-1 grid gap-3 rounded-[10px] border border-line bg-bg p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-fg text-[13px] font-semibold text-bg">YB</span>
                <div className="text-left"><p className="text-[13.5px] font-semibold">Yasmine B.</p><p className="text-[12px] text-muted">{t('Full-stack developer, React and Node.js')}</p></div>
              </div>
              <div className="flex flex-wrap gap-1.5"><Badge tone="route">{t('Open to jobs')}</Badge><Badge>{t('Freelance')}</Badge></div>
              <div className="flex gap-2">
                <span className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[7px] bg-fg text-[12.5px] font-medium text-bg"><MessageSquare className="size-3.5" />{t('Get in touch')}</span>
                <span className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[7px] border border-line-strong text-[12.5px] font-medium"><Contact className="size-3.5" />{t('Save contact')}</span>
              </div>
            </div>
          </Cell>
        </div>
      </section>

      {/* ------------------------------------------------ Connect */}
      <section className="border-y border-line bg-surface" hidden={!people.data?.items.length}>
        <div className="mx-auto grid max-w-[1120px] gap-12 px-4 py-24 sm:px-8 lg:grid-cols-[.85fr_1.15fr]">
          <div className="grid content-start gap-5">
            <h2 className="text-[34px] tracking-[-0.035em] sm:text-[42px]">{t('Where people, startups and companies find each other.')}</h2>
            <p className="text-[15.5px] leading-relaxed text-muted">{t('Startups post roles, co-founder searches and funding calls. Companies find talent. Every introduction lands in one inbox, with a status, so nothing gets lost.')}</p>
            <ul className="grid gap-2.5 text-[14px]">
              {[t('A searchable directory, filtered by skill, city and intent'), t('Opportunities with their own short link and QR code'), t('Contact details stay private until you answer')].map((x) => (
                <li key={x} className="flex gap-2.5"><span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-accent" />{x}</li>
              ))}
            </ul>
            <Link to="/discover" className="mt-2"><Button variant="secondary">{t('Browse the directory')}</Button></Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(people.data?.items ?? []).slice(0, 4).map((p) => <ProfileTile key={p.handle} p={p} />)}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Final CTA */}
      <section className="relative overflow-hidden">
        <div className="module-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_65%)]" aria-hidden />
        <div className="relative mx-auto grid max-w-[720px] justify-items-center gap-6 px-4 py-28 text-center">
          <h2 className="text-[36px] tracking-[-0.04em] sm:text-[52px]">{t('Your next link deserves better.')}</h2>
          <p className="text-[16px] text-muted">{t('Create an account in ten seconds, or look around the demo first.')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/register"><Button size="lg">{t('Start for free')}</Button></Link>
            <Button size="lg" variant="secondary" loading={demo.isPending} onClick={() => demo.mutate()}>{t('Explore the live demo')}</Button>
          </div>
        </div>
      </section>
    </main>
  );
}

function SectionTitle({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto grid max-w-[640px] gap-4 text-center">
      <h2 className="text-[32px] tracking-[-0.035em] sm:text-[42px]">{title}</h2>
      <p className="text-[15.5px] text-muted">{body}</p>
    </div>
  );
}

function Cell({ title, body, children, className }: { title: string; body: string; children: ReactNode; className?: string }) {
  return (
    <article className={cx('group relative grid content-start gap-4 overflow-hidden rounded-[16px] border border-line bg-surface p-6 transition-colors hover:border-line-strong', className)}>
      <div className="grid gap-1.5">
        <h3 className="text-[16px] font-semibold tracking-[-0.02em]">{title}</h3>
        <p className="max-w-[48ch] text-[13.5px] leading-relaxed text-muted">{body}</p>
      </div>
      {children}
    </article>
  );
}

/** Packets travel from one short link to the destination their rule picks. */
function RoutingDemo() {
  const { t } = useT();
  const dests = [
    { y: 34, label: t('iPhone → App Store'), color: 'var(--accent)' },
    { y: 92, label: t('Morocco → French page'), color: 'var(--color-signal)' },
    { y: 150, label: t('50% → Pricing B'), color: 'var(--color-mint)' },
    { y: 208, label: t('Everyone else → Pricing'), color: 'var(--faint)' },
  ];
  return (
    <svg viewBox="0 0 640 230" className="size-full" role="img" aria-label={t('A short link routing visitors to four destinations')}>
      <rect x="8" y="94" width="150" height="42" rx="10" fill="var(--fg)" />
      <text x="83" y="120" textAnchor="middle" className="fill-bg font-mono text-[13px]">wrx.app/launch</text>
      {dests.map((d, i) => {
        const path = `M158,115 C300,115 300,${d.y} 420,${d.y}`;
        return (
          <g key={i}>
            <path d={path} fill="none" stroke="var(--line-strong)" strokeWidth="1.2" />
            <circle r="3.5" fill={d.color}>
              <animateMotion dur={`${2.2 + i * 0.35}s`} begin={`${i * 0.55}s`} repeatCount="indefinite" path={path} keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines=".4 0 .2 1" />
            </circle>
            <rect x="420" y={d.y - 16} width="212" height="32" rx="8" fill="var(--bg)" stroke="var(--line)" />
            <circle cx="436" cy={d.y} r="3.5" fill={d.color} />
            <text x="448" y={d.y + 4.5} className="fill-fg text-[12.5px]">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function QrLoop() {
  const urls = ['https://wrx.app/menu?r=qr', 'https://wrx.app/launch?r=qr', 'https://wrx.app/b/demo'];
  const [i, setI] = useState(0);
  useEffect(() => { const id = setInterval(() => setI((x) => (x + 1) % urls.length), 3200); return () => clearInterval(id); }, []);
  return <div className="rounded-2xl border border-line bg-white p-3 shadow-[0_1px_2px_rgb(0_0_0/.05)]"><AssemblingQr text={urls[i]!} size={150} /></div>;
}

function LiveCounter() {
  const { t, lang } = useT();
  const [n, setN] = useState(18_420);
  const [bars, setBars] = useState(() => Array.from({ length: 28 }, (_, i) => 30 + Math.round(Math.sin(i / 3) * 18 + ((i * 37) % 23))));
  useEffect(() => {
    const id = setInterval(() => {
      setN((x) => x + 1 + Math.floor(Math.random() * 4));
      setBars((b) => [...b.slice(1), 28 + Math.floor(Math.random() * 46)]);
    }, 900);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="grid h-full content-between">
      <div className="flex items-baseline gap-2">
        <span className="text-[34px] font-semibold tracking-[-0.04em] tabular">{n.toLocaleString(lang)}</span>
        <span className="inline-flex items-center gap-1 text-[12px] text-faint"><span className="size-1.5 animate-pulse rounded-full bg-accent" />{t('sample data')}</span>
      </div>
      <div className="flex h-24 items-end gap-[3px]" aria-hidden>
        {bars.map((h, i) => <span key={i} className="flex-1 rounded-t-[2px] bg-accent transition-[height] duration-700" style={{ height: `${h}%`, opacity: 0.25 + (i / bars.length) * 0.75 }} />)}
      </div>
    </div>
  );
}

function MapDemo() {
  const data = [{ key: 'MA', value: 26 }, { key: 'FR', value: 18 }, { key: 'US', value: 12 }, { key: 'ES', value: 6 }, { key: 'DE', value: 6 }, { key: 'GB', value: 5 }, { key: 'CA', value: 4 }, { key: 'AE', value: 3 }, { key: 'IN', value: 2 }, { key: 'BR', value: 1 }, { key: 'JP', value: 1 }];
  return <div className="-mx-6 -mb-6 mt-[-24px]"><WorldMap data={data} /></div>;
}
