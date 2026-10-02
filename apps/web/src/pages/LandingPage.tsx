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
          <a className="transition hover:text-white" href="#workflow">
            Comment ça marche
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
              href="#workflow"
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
