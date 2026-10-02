import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Link2,
  QrCode,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const features = [
  [
    'Liens qui vous ressemblent',
    'Des URLs courtes, nettes et mémorables pour chaque campagne.',
    Link2,
  ],
  [
    'QR codes vivants',
    'Modifiez la destination quand vous voulez, sans réimprimer votre QR.',
    QrCode,
  ],
  [
    'Décisions plus rapides',
    'Suivez les clics, scans et tendances dans une interface lisible.',
    BarChart3,
  ],
];

const qrCells = Array.from({ length: 121 }, (_, index) => {
  const column = index % 11;
  const row = Math.floor(index / 11);
  const inFinder = (startRow: number, startColumn: number) =>
    row >= startRow && row < startRow + 3 && column >= startColumn && column < startColumn + 3;
  const finder = inFinder(0, 0) || inFinder(0, 8) || inFinder(8, 0);
  return finder || (row * 7 + column * 11 + row * column) % 5 < 2;
});

const storySlides = [
  {
    number: '01',
    eyebrow: 'Un signal, en quelques secondes',
    title: 'Collez une destination. Le QR prend vie.',
    copy: 'Une URL devient un point de départ partageable — propre, vivant et prêt à circuler.',
    label: 'wrx.ma/summer-drop',
  },
  {
    number: '02',
    eyebrow: 'Une identité qui se scanne',
    title: 'Faites-le ressembler à votre idée.',
    copy: 'Choisissez une couleur, ajustez le contraste et gardez un QR aussi reconnaissable que votre campagne.',
    label: 'Palette synchronisée',
  },
  {
    number: '03',
    eyebrow: 'Chaque scan raconte quelque chose',
    title: 'Regardez l’attention se transformer en mouvement.',
    copy: 'Les scans deviennent des signaux : où, quand et ce qui donne envie de continuer.',
    label: '+ 628 scans cette semaine',
  },
];

const qrPalettes = [
  { name: 'Cyan', value: '#67e8f9', glow: 'rgba(103, 232, 249, .42)' },
  { name: 'Violet', value: '#c4b5fd', glow: 'rgba(196, 181, 253, .42)' },
  { name: 'Corail', value: '#fda4af', glow: 'rgba(253, 164, 175, .42)' },
];

function QrStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [paletteIndex, setPaletteIndex] = useState(0);
  // The first and last part of the sticky section are intentional breathing room.
  const storyProgress = Math.min(1, Math.max(0, (progress - 0.18) / 0.64));
  const activeSlide = Math.min(
    storySlides.length - 1,
    Math.floor(storyProgress * storySlides.length)
  );
  const activeStory = storySlides[activeSlide] ?? storySlides[0]!;
  const palette = qrPalettes[paletteIndex] ?? qrPalettes[0]!;

  useEffect(() => {
    let frame = 0;
    const updateProgress = () => {
      const section = sectionRef.current;
      if (!section) return;
      const distance = Math.max(1, section.offsetHeight - window.innerHeight);
      const nextProgress = Math.min(
        1,
        Math.max(0, -section.getBoundingClientRect().top / distance)
      );
      setProgress((current) => (Math.abs(current - nextProgress) > 0.002 ? nextProgress : current));
    };
    const onScroll = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(() => {
          frame = 0;
          updateProgress();
        });
      }
    };
    updateProgress();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="qr-story"
      className="qr-story relative h-[250vh]"
      aria-label="Expérience QR interactive"
    >
      <div className="sticky top-0 flex min-h-screen items-center overflow-hidden py-16">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[.88fr_1.12fr] lg:items-center">
          <div className="relative z-10 min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[.22em] text-cyan-300">
              L'expérience QR
            </p>
            <div className="mt-5 flex gap-2" aria-hidden="true">
              {storySlides.map((slide, index) => (
                <span
                  key={slide.number}
                  className={`h-1 w-10 rounded-full transition-all duration-500 ${index <= activeSlide ? 'bg-cyan-300' : 'bg-white/15'}`}
                />
              ))}
            </div>
            <div className="qr-story-copy mt-7 min-w-0 overflow-hidden">
              <div
                className="flex w-[300%] transition-transform duration-500 ease-out motion-reduce:transition-none"
                style={{ transform: `translateX(-${storyProgress * (200 / 3)}%)` }}
              >
                {storySlides.map((slide) => (
                  <article key={slide.number} className="w-1/3 min-w-0 pr-8 sm:pr-14">
                    <span className="font-mono text-sm text-cyan-200">{slide.number}</span>
                    <p className="mt-5 text-sm font-medium text-slate-300">{slide.eyebrow}</p>
                    <h2 className="mt-3 max-w-md text-4xl font-semibold tracking-tight sm:text-5xl">
                      {slide.title}
                    </h2>
                    <p className="mt-5 max-w-md text-lg leading-8 text-slate-400">{slide.copy}</p>
                    <span className="mt-7 inline-flex rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-sm text-slate-200">
                      {slide.label}
                    </span>
                  </article>
                ))}
              </div>
            </div>
            <p className="mt-10 text-xs text-slate-500">Scrollez pour construire l'histoire ↓</p>
          </div>

          <div className="relative mx-auto w-full max-w-2xl">
            <div
              className="absolute inset-10 rounded-full blur-3xl transition-colors duration-700"
              style={{ backgroundColor: palette.glow }}
            />
            <div className="qr-stage relative overflow-hidden rounded-[2rem] border border-white/15 bg-[#0b1021]/90 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-7">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <i className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" /> WRX Studio
                </span>
                <span>{activeStory.number} / 03</span>
              </div>
              <div className="relative mt-6 grid min-h-[340px] place-items-center overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#070b19] sm:min-h-[405px]">
                <div
                  className="qr-orbit qr-orbit-one"
                  style={{ borderColor: `${palette.value}45` }}
                />
                <div
                  className="qr-orbit qr-orbit-two"
                  style={{ borderColor: `${palette.value}30` }}
                />
                <div className="absolute left-5 top-5 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] uppercase tracking-[.16em] text-slate-300">
                  {activeSlide === 0
                    ? 'Génération instantanée'
                    : activeSlide === 1
                      ? 'Mode identité'
                      : 'Signal détecté'}
                </div>
                <div
                  className="qr-code-shell relative z-10 grid h-48 w-48 grid-cols-11 gap-[3px] rounded-2xl bg-white p-3 shadow-2xl transition-all duration-700 sm:h-56 sm:w-56"
                  style={{ boxShadow: `0 24px 70px ${palette.glow}` }}
                >
                  {qrCells.map((filled, index) => (
                    <span
                      key={index}
                      className="rounded-[1px] transition-colors duration-500"
                      style={{ backgroundColor: filled ? palette.value : 'transparent' }}
                    />
                  ))}
                  {activeSlide === 2 && (
                    <span className="qr-scan-line" style={{ backgroundColor: palette.value }} />
                  )}
                </div>
                {activeSlide === 1 && (
                  <div className="absolute bottom-5 flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/80 p-1.5 shadow-xl backdrop-blur">
                    {qrPalettes.map((item, index) => (
                      <button
                        key={item.name}
                        type="button"
                        aria-label={`Choisir la palette ${item.name}`}
                        onClick={() => setPaletteIndex(index)}
                        className={`h-7 w-7 rounded-full border-2 transition ${paletteIndex === index ? 'scale-110 border-white' : 'border-transparent hover:scale-110'}`}
                        style={{ backgroundColor: item.value }}
                      />
                    ))}
                  </div>
                )}
                {activeSlide === 2 && (
                  <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-slate-950/85 p-3 backdrop-blur sm:left-auto sm:w-52">
                    <div className="flex items-end justify-between">
                      <span className="text-[10px] text-slate-400">Scans aujourd'hui</span>
                      <b className="text-sm text-white">184</b>
                    </div>
                    <div className="mt-3 flex h-8 items-end gap-1">
                      {[38, 65, 42, 80, 56, 96, 74, 100].map((height, index) => (
                        <span
                          key={index}
                          className="flex-1 rounded-t bg-cyan-300/80"
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.035] px-4 py-3 text-sm">
                <span className="text-slate-400">
                  {activeSlide === 0
                    ? 'Destination connectée'
                    : activeSlide === 1
                      ? `Palette ${palette.name}`
                      : 'Performance en direct'}
                </span>
                <span className="font-medium" style={{ color: palette.value }}>
                  {activeSlide === 2 ? '↗ +24.8%' : 'Actif'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingPage() {
  return (
    <main className="landing min-h-screen overflow-hidden bg-[#070b19] text-white">
      <div className="landing-grid pointer-events-none fixed inset-0 opacity-40" />
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <a href="#top" className="flex items-center gap-3 font-semibold tracking-tight">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-blue-600 text-lg shadow-lg shadow-cyan-500/20">
            W
          </span>
          <span>
            WRX <span className="text-cyan-300">Generator</span>
          </span>
        </a>
        <div className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
          <a className="transition hover:text-white" href="#features">
            Fonctionnalités
          </a>
          <a className="transition hover:text-white" href="#qr-story">
            L'expérience QR
          </a>
          <a className="transition hover:text-white" href="#pricing">
            Tarifs
          </a>
        </div>
        <Link
          className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium transition hover:border-cyan-300 hover:bg-white/10"
          to="/login"
        >
          Se connecter
        </Link>
      </nav>

      <section
        id="top"
        className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-24 pt-12 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:pb-36 lg:pt-24"
      >
        <div className="relative z-10">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-medium text-cyan-100">
            <Sparkles size={14} /> Le lien entre vos idées et leur impact
          </div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[.98] tracking-[-.06em] text-white sm:text-6xl lg:text-7xl">
            Chaque scan peut <span className="text-gradient-aurora">déclencher quelque chose.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">
            Créez des liens courts et des QR codes élégants. Mesurez leur impact. Ajustez votre
            prochaine idée en quelques secondes.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-100"
            >
              Commencer gratuitement{' '}
              <ArrowRight size={18} className="transition group-hover:translate-x-1" />
            </Link>
            <a
              href="#qr-story"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 font-medium text-white transition hover:bg-white/10"
            >
              Découvrir le produit <ChevronRight size={18} />
            </a>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
            {['Aucune carte bancaire', 'QR codes dynamiques', 'Données protégées'].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <Check size={16} className="text-cyan-300" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <div className="absolute -inset-10 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="hero-dashboard relative rotate-[-3deg] rounded-[2rem] border border-white/15 bg-slate-950/70 p-4 shadow-2xl shadow-cyan-950/60 backdrop-blur-xl transition duration-700 hover:rotate-0 sm:p-5">
            <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex gap-1.5">
                <i className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <i className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <i className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="text-xs text-slate-400">Vue d'ensemble</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['Liens actifs', '48', 'text-cyan-200'],
                ['Clics ce mois', '12.4k', 'text-violet-200'],
                ['Engagement', '+32%', 'text-emerald-200'],
              ].map(([label, value, color]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[.04] p-3">
                  <p className="text-[11px] text-slate-400">{label}</p>
                  <p className={`mt-2 text-xl font-semibold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[.07] to-transparent p-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-slate-400">Trafic de cette semaine</p>
                  <p className="mt-1 text-2xl font-semibold">
                    2 847 <span className="text-sm font-normal text-emerald-300">↗ 18.4%</span>
                  </p>
                </div>
                <span className="rounded-full bg-cyan-300/10 px-2 py-1 text-[10px] text-cyan-100">
                  Live
                </span>
              </div>
              <div className="mt-7 flex h-24 items-end gap-2">
                {[35, 52, 44, 65, 58, 82, 72, 96, 78, 88, 100, 84].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h}%` }}
                    className="flex-1 rounded-t-full bg-gradient-to-t from-blue-600 to-cyan-300 opacity-80"
                  />
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.06] p-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-white p-1">
                <span className="grid h-full w-full place-items-center border-2 border-slate-900 text-[8px] text-slate-900">
                  QR
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">Summer drop</p>
                <p className="text-xs text-slate-400">wrx.ma/summer · 628 scans</p>
              </div>
              <span className="ml-auto text-emerald-300">↗</span>
            </div>
          </div>
        </div>
      </section>

      <QrStory />

      <section id="features" className="relative border-y border-white/10 bg-white/[.025] py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[.22em] text-cyan-300">
            Pensé pour avancer
          </p>
          <div className="mt-4 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <h2 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Simple au départ.
              <br />
              Puissant quand ça compte.
            </h2>
            <p className="max-w-sm text-slate-400">
              Le meilleur outil est celui qui vous laisse plus de temps pour le vrai travail.
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {features.map(([title, description, Icon]) => {
              const FeatureIcon = Icon as typeof Link2;
              return (
                <article
                  key={title as string}
                  className="group rounded-3xl border border-white/10 bg-slate-900/40 p-7 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-slate-900"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200">
                    <FeatureIcon size={21} />
                  </div>
                  <h3 className="mt-8 text-xl font-semibold">{title as string}</h3>
                  <p className="mt-3 leading-7 text-slate-400">{description as string}</p>
                  <span className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-cyan-200">
                    Explorer{' '}
                    <ArrowRight size={15} className="transition group-hover:translate-x-1" />
                  </span>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="workflow" className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.22em] text-cyan-300">
              Un rythme plus fluide
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              De l'idée au signal.
              <br />
              Sans friction.
            </h2>
          </div>
          <div className="space-y-4">
            {[
              [
                '01',
                'Créez en quelques secondes',
                'Choisissez votre destination, votre slug et votre style.',
              ],
              [
                '02',
                'Diffusez partout',
                'Copiez votre lien ou téléchargez un QR code prêt à partager.',
              ],
              [
                '03',
                'Apprenez de chaque scan',
                'Vos données vous montrent ce qui attire vraiment l’attention.',
              ],
            ].map(([n, title, copy]) => (
              <div
                key={n}
                className="flex gap-5 rounded-2xl border border-white/10 p-5 transition hover:border-white/25"
              >
                <span className="font-mono text-sm text-cyan-300">{n}</span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="relative mx-auto max-w-5xl px-5 pb-24 sm:px-8">
        <div className="rounded-[2rem] border border-cyan-300/20 bg-gradient-to-br from-cyan-300/15 via-blue-500/10 to-violet-500/15 p-8 text-center sm:p-14">
          <Zap className="mx-auto text-cyan-200" />
          <h2 className="mt-5 text-4xl font-semibold tracking-tight">
            Votre prochain lien commence ici.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-slate-300">
            Donnez une vraie direction à chaque campagne, affiche ou conversation.
          </p>
          <Link
            to="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-100"
          >
            Créer mon espace <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      <footer className="relative border-t border-white/10 px-5 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} WRX Generator · Conçu pour créer du mouvement.
      </footer>
    </main>
  );
}
