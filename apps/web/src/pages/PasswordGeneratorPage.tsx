import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { ResourceTabs } from '../components/ProductPrimitives';
import { useAuthStore } from '../stores/auth.store';

type CharacterSet = 'uppercase' | 'lowercase' | 'numbers' | 'symbols';
type PasswordOptions = Record<CharacterSet, boolean>;
interface PasswordEntry {
  id: string;
  value: string;
  createdAt: string;
  options: PasswordOptions;
}

const STORAGE_PREFIX = 'wrx:password-history:v1:';
const SETS: { key: CharacterSet; label: string; chars: string }[] = [
  { key: 'uppercase', label: 'Majuscules', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
  { key: 'lowercase', label: 'Minuscules', chars: 'abcdefghijklmnopqrstuvwxyz' },
  { key: 'numbers', label: 'Chiffres', chars: '0123456789' },
  { key: 'symbols', label: 'Symboles', chars: '!@#$%^&*()-_=+[]{}:,.?' },
];
const DEFAULT_OPTIONS: PasswordOptions = {
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: false,
};

function strengthFor(bits: number) {
  if (bits < 40) return { label: 'Faible', tone: 'weak', level: 1 };
  if (bits < 70) return { label: 'Correcte', tone: 'fair', level: 2 };
  if (bits < 100) return { label: 'Forte', tone: 'strong', level: 3 };
  return { label: 'Très forte', tone: 'excellent', level: 4 };
}

function randomIndex(max: number): number {
  const limit = Math.floor(256 / max) * max;
  const byte = new Uint8Array(1);
  do {
    crypto.getRandomValues(byte);
  } while (byte[0]! >= limit);
  return byte[0]! % max;
}

function makePassword(length: number, options: PasswordOptions): string {
  const enabledSets = SETS.filter(({ key }) => options[key]);
  if (!enabledSets.length || length < enabledSets.length) {
    throw new Error('Activez au moins un type de caractère et choisissez une longueur suffisante.');
  }

  const chars = enabledSets.map(({ chars: group }) => group);
  const result = chars.map((group) => group[randomIndex(group.length)]!);
  const pool = chars.join('');
  while (result.length < length) result.push(pool[randomIndex(pool.length)]!);

  // Fisher-Yates with unbiased cryptographic indices.
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result.join('');
}

function readHistory(key: string): PasswordEntry[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(stored)) return [];
    return stored.filter(
      (entry): entry is PasswordEntry =>
        !!entry && typeof entry.id === 'string' && typeof entry.value === 'string' &&
        typeof entry.createdAt === 'string' && typeof entry.options === 'object'
    );
  } catch {
    return [];
  }
}

export function PasswordGeneratorPage() {
  const outputRef = useRef<HTMLOutputElement>(null);
  const userId = useAuthStore((state) => state.user?.id);
  const storageKey = userId ? `${STORAGE_PREFIX}${userId}` : null;
  const [length, setLength] = useState(20);
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [password, setPassword] = useState('');
  const [history, setHistory] = useState<PasswordEntry[]>([]);
  const [visible, setVisible] = useState(true);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [error, setError] = useState('');
  const [outputRevision, setOutputRevision] = useState(0);
  const [newestEntryId, setNewestEntryId] = useState<string | null>(null);
  const [removingEntryId, setRemovingEntryId] = useState<string | null>(null);
  const [justGenerated, setJustGenerated] = useState(false);
  const [generatedEntropy, setGeneratedEntropy] = useState<number | null>(null);

  useEffect(() => {
    setHistory(storageKey ? readHistory(storageKey) : []);
  }, [storageKey]);

  const alphabetSize = useMemo(
    () => SETS.filter(({ key }) => options[key]).reduce((sum, set) => sum + set.chars.length, 0),
    [options]
  );
  const entropy = Math.floor(length * Math.log2(alphabetSize || 1));
  const configuredStrength = strengthFor(entropy);
  const passwordStrength = generatedEntropy === null ? null : strengthFor(generatedEntropy);
  const settingsChanged = password && generatedEntropy !== entropy;

  const persist = (next: PasswordEntry[]) => {
    setHistory(next);
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setStorageAvailable(true);
    } catch {
      setStorageAvailable(false);
    }
  };

  const generate = () => {
    try {
      if (!globalThis.crypto?.getRandomValues) throw new Error('La génération sécurisée n’est pas disponible dans ce navigateur.');
      const value = makePassword(length, options);
      requestAnimationFrame(() => {
        const output = outputRef.current;
        if (!output) return;
        const bounds = output.getBoundingClientRect();
        if (bounds.top < 80 || bounds.bottom > window.innerHeight - 80) output.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      });
      const entry: PasswordEntry = {
        id: crypto.randomUUID(),
        value,
        createdAt: new Date().toISOString(),
        options: { ...options },
      };
      setPassword(value);
      setGeneratedEntropy(entropy);
      setOutputRevision((revision) => revision + 1);
      setJustGenerated(true);
      window.setTimeout(() => setJustGenerated(false), 1200);
      setVisible(true);
      setError('');
      setNewestEntryId(entry.id);
      persist([entry, ...history].slice(0, 50));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de générer ce mot de passe.');
    }
  };

  const copy = async (value: string, id: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setError('Le presse-papiers est inaccessible. Autorisez son accès puis réessayez.');
    }
  };

  const removeEntry = (id: string) => {
    setRemovingEntryId(id);
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180;
    window.setTimeout(() => {
      persist(history.filter((entry) => entry.id !== id));
      setRemovingEntryId(null);
    }, delay);
  };

  return (
    <div className="password-workspace mx-auto space-y-6">
      <header>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-100 p-2.5 text-cyan-800"><KeyRound size={22} /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Le hasard, bien réglé.</h1>
            <p className="text-sm text-slate-600">Créez des mots de passe forts, directement sur cet appareil.</p>
          </div>
        </div>
      </header>

      <section className="card password-console" aria-labelledby="password-output-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="password-output-title" className="text-lg font-semibold text-slate-900">Votre mot de passe</h2>
          {passwordStrength && <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700"><ShieldCheck size={16} /> {passwordStrength.label} · {generatedEntropy} bits estimés</span>}
        </div>

        <div className="password-output flex min-h-16 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 sm:p-3">
          <output ref={outputRef} aria-live="polite" className="min-w-0 flex-1 break-all px-2 font-mono text-lg tracking-wide text-slate-900 sm:text-xl">
            {password && visible ? (
              <span key={outputRevision} className="wrx-password-resolve">
                {Array.from(password, (character, index) => (
                  <span key={`${outputRevision}-${index}`} className="wrx-password-char" style={{ animationDelay: `${Math.min(index * 14, 220)}ms` }}>{character}</span>
                ))}
              </span>
            ) : <span>{password ? '•'.repeat(password.length) : 'Cliquez sur Générer'}</span>}
          </output>
          {password && <>
            <button type="button" aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-700" onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            <button type="button" className={`wrx-copy-action btn btn-outline flex shrink-0 items-center gap-2 ${copiedId === 'current' ? 'text-emerald-700' : ''}`} onClick={() => void copy(password, 'current')} aria-label={copiedId === 'current' ? 'Mot de passe copié' : 'Copier le mot de passe'} aria-live="polite" data-copied={copiedId === 'current'}>{copiedId === 'current' ? <Check size={17} /> : <Copy size={17} />}<span className="hidden sm:inline">{copiedId === 'current' ? 'Copié' : 'Copier'}</span></button>
          </>}
        </div>

        <div className="password-config">
          <div className="wrx-password-control" data-strength={configuredStrength.tone}>
            <div className="mb-3 flex items-end justify-between gap-3">
              <label htmlFor="password-length" className="text-sm font-medium text-slate-800">Longueur</label>
              <div className="flex items-baseline gap-1" aria-hidden="true"><strong key={length} className="wrx-length-number">{length}</strong><span className="text-xs text-slate-500">caractères</span></div>
            </div>
            <input id="password-length" aria-valuetext={`${length} caractères, force ${configuredStrength.label.toLowerCase()}`} type="range" min={8} max={64} value={length} onChange={(event) => setLength(Number(event.target.value))} style={{ '--wrx-range-progress': `${((length - 8) / 56) * 100}%` } as React.CSSProperties} className="wrx-range w-full" />
            <div className="mt-1 flex justify-between text-xs text-slate-500"><span>8</span><span>24</span><span>40</span><span>64</span></div>
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-800">Types de caractères</legend>
            <div className="grid grid-cols-2 gap-2">
              {SETS.map(({ key, label }) => <label key={key} data-enabled={options[key]} className="wrx-character-set flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-700">
                <input type="checkbox" checked={options[key]} disabled={options[key] && Object.values(options).filter(Boolean).length === 1} onChange={(event) => setOptions((current) => ({ ...current, [key]: event.target.checked }))} className="accent-cyan-700" />{label}
              </label>)}
            </div>
          </fieldset>
        </div>

        <div className="wrx-strength-panel" data-strength={configuredStrength.tone}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Prochain mot de passe</p>
            <p className="text-sm font-semibold"><span className="wrx-strength-label">{configuredStrength.label}</span><span className="ml-2 font-mono text-xs text-slate-500">{entropy} bits estimés</span></p>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={configuredStrength.level} aria-label="Force estimée du prochain mot de passe">
            {[1, 2, 3, 4].map((segment) => <span key={segment} className="wrx-strength-segment" data-filled={segment <= configuredStrength.level} />)}
          </div>
          <p className="mt-2 text-xs text-slate-500">Estimation selon la longueur et les caractères sélectionnés.</p>
        </div>

        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="password-action flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-primary wrx-generate-button inline-flex w-full items-center justify-center gap-2 sm:w-auto" data-generated={justGenerated} onClick={generate}>{justGenerated ? <Check size={17} /> : <RefreshCw size={17} />} {justGenerated ? 'Mot de passe généré' : 'Générer un mot de passe'}</button>
          {settingsChanged && <span role="status" className="wrx-config-changed text-xs font-medium text-cyan-800">Réglages modifiés · générez à nouveau</span>}
        </div>
        <p className="text-xs leading-relaxed text-slate-500">Le mot de passe est généré dans votre navigateur et n’est jamais envoyé à WRX. L’historique est enregistré localement dans ce navigateur pour ce compte; il n’est pas chiffré et ne se synchronise pas entre appareils.</p>
        {!storageAvailable && <p role="status" className="text-sm text-amber-700">Le stockage local est indisponible : cet historique ne sera conservé que pendant cette visite.</p>}
      </section>

      <ResourceTabs />
      <section className="password-history card" aria-labelledby="history-title">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div><h2 id="history-title" className="text-lg font-semibold text-slate-900">Historique des mots de passe</h2><p className="text-sm text-slate-500">Les 50 dernières générations sur cet appareil · {history.length}</p></div>
          <div className="flex gap-2">
            {history.length > 0 && <button type="button" className="btn btn-outline inline-flex items-center gap-2" onClick={() => setHistoryVisible(!historyVisible)}>{historyVisible ? <EyeOff size={16} /> : <Eye size={16} />}{historyVisible ? 'Masquer' : 'Afficher'}</button>}
            {history.length > 0 && <button type="button" className="btn btn-outline inline-flex items-center gap-2 text-red-700" onClick={() => persist([])}><Trash2 size={16} /> Tout effacer</button>}
          </div>
        </div>
        {history.length === 0 ? <p className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Vos mots de passe générés apparaîtront ici. Ils restent sur cet appareil.</p> :
          <ul className="divide-y divide-slate-100">
            {history.map((entry) => <li key={entry.id} className={`wrx-history-item flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0 ${entry.id === newestEntryId ? 'wrx-history-enter' : ''} ${entry.id === removingEntryId ? 'wrx-history-removing' : ''}`}>
              <div className="min-w-0 flex-1">
                <p className="break-all font-mono text-sm text-slate-900">{historyVisible ? entry.value : '•'.repeat(entry.value.length)}</p>
                <p className="mt-1 text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()} · {entry.value.length} caractères · {SETS.filter(({ key }) => entry.options[key]).map(({ label }) => label.toLowerCase()).join(', ')}</p>
              </div>
              <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-700" aria-label="Copier ce mot de passe" onClick={() => void copy(entry.value, entry.id)}>{copiedId === entry.id ? <Check size={17} className="text-emerald-700" /> : <Copy size={17} />}</button>
              <button type="button" disabled={removingEntryId !== null} className="rounded-lg p-2 text-red-600 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-700 disabled:opacity-50" aria-label="Supprimer ce mot de passe" onClick={() => removeEntry(entry.id)}><Trash2 size={17} /></button>
            </li>)}
          </ul>}
      </section>
    </div>
  );
}
