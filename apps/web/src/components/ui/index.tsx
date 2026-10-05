import { clsx } from 'clsx';
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { Check, Copy, Loader2, X } from 'lucide-react';
import { useT } from '@/lib/i18n';

export const cx = clsx;

/* ------------------------------ Button ------------------------------ */
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'signal';
const btn: Record<BtnVariant, string> = {
  primary: 'bg-ink text-white hover:bg-ink-2 dark:bg-accent dark:text-ink dark:hover:brightness-110',
  secondary: 'bg-surface text-fg border border-line hover:bg-raised',
  ghost: 'text-muted hover:text-fg hover:bg-raised',
  danger: 'bg-coral text-white hover:brightness-95',
  signal: 'bg-signal text-ink hover:brightness-105',
};
export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: BtnVariant;
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
  }
>(({ variant = 'primary', size = 'md', loading, className, children, disabled, ...p }, ref) => (
  <button
    ref={ref}
    disabled={disabled || loading}
    className={cx(
      'inline-flex select-none items-center justify-center gap-2 rounded-[var(--radius-control)] font-medium transition-[background,filter,color] duration-150 disabled:pointer-events-none disabled:opacity-55',
      size === 'sm' && 'h-8 px-3 text-[13px]',
      size === 'md' && 'h-10 px-4 text-sm',
      size === 'lg' && 'h-12 px-6 text-[15px]',
      btn[variant],
      className,
    )}
    {...p}
  >
    {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
    {children}
  </button>
));

export const IconButton = ({
  label,
  className,
  children,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) => (
  <button
    aria-label={label}
    title={label}
    className={cx(
      'grid size-9 place-items-center rounded-[var(--radius-control)] text-muted transition hover:bg-raised hover:text-fg',
      className,
    )}
    {...p}
  >
    {children}
  </button>
);

/* ------------------------------ Fields ------------------------------ */
const control =
  'rounded-[var(--radius-control)] border border-line bg-surface px-3 text-[14px] text-fg placeholder:text-faint transition focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15 aria-[invalid=true]:border-coral';

export function Field({
  label,
  hint,
  error,
  children,
  className,
  htmlFor,
}: {
  label?: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cx('grid gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-fg">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="text-[12.5px] text-coral">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12.5px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; leading?: ReactNode }
>(({ className, invalid, leading, ...p }, ref) =>
  leading ? (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-faint">
        {leading}
      </span>
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cx(control, 'h-10 w-full pl-9', className)}
        {...p}
      />
    </div>
  ) : (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cx(control, 'h-10 w-full', className)}
      {...p}
    />
  ),
);
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(({ className, invalid, ...p }, ref) => (
  <textarea
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cx(control, 'min-h-24 w-full py-2.5 leading-relaxed', className)}
    {...p}
  />
));
export const Select = ({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    className={cx(
      control,
      !className?.includes('w-auto') && 'w-full',
      'h-10 appearance-none bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-9',
      className,
    )}
    style={{
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238a94ab' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
    }}
    {...p}
  >
    {children}
  </select>
);

export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <label htmlFor={id} className="grid gap-0.5">
        <span className="text-[14px] font-medium">{label}</span>
        {description && <span className="text-[12.5px] text-muted">{description}</span>}
      </label>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        type="button"
        className={cx(
          'relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition-colors',
          checked ? 'bg-route' : 'bg-line',
        )}
      >
        <span
          className={cx(
            'absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex rounded-[var(--radius-control)] border border-line bg-raised p-0.5"
    >
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cx(
            'h-8 rounded-[8px] px-3 text-[13px] font-medium transition',
            value === o.value ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const Badge = ({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: 'neutral' | 'route' | 'mint' | 'coral' | 'signal';
  children: ReactNode;
  className?: string;
}) => (
  <span
    className={cx(
      'inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium',
      tone === 'neutral' && 'bg-raised text-muted',
      tone === 'route' && 'bg-accent-soft text-accent',
      tone === 'mint' && 'bg-mint/12 text-mint',
      tone === 'coral' && 'bg-coral/12 text-coral',
      tone === 'signal' && 'bg-signal/20 text-[#8a5a00] dark:text-signal',
      className,
    )}
  >
    {children}
  </span>
);

export const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="rounded-md border border-line bg-raised px-1.5 py-0.5 font-mono text-[11px] text-muted">
    {children}
  </kbd>
);

/* ------------------------------ Dialog / Drawer ------------------------------ */
export function Dialog({
  open,
  onClose,
  title,
  children,
  size = 'md',
  side,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  side?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useT();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={title}
      className={cx(
        'm-0 max-h-none max-w-none bg-transparent p-0 backdrop:bg-ink/40 backdrop:backdrop-blur-[2px] open:flex',
        side
          ? 'ml-auto h-dvh w-full sm:w-[min(560px,100vw)] open:animate-[slide-in_.32s_var(--ease-out)]'
          : 'mx-auto my-auto w-[calc(100vw-24px)] open:animate-[pop_.22s_var(--ease-out)]',
        !side && size === 'sm' && 'max-w-md',
        !side && size === 'md' && 'max-w-xl',
        !side && size === 'lg' && 'max-w-3xl',
      )}
    >
      <div
        className={cx(
          'flex w-full flex-col overflow-hidden border border-line bg-surface text-fg shadow-2xl',
          side ? 'h-full' : 'max-h-[88dvh] rounded-[18px]',
        )}
      >
        <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
          <h2 className="text-[17px] font-semibold">{title}</h2>
          <IconButton label={t('Close')} onClick={onClose}>
            <X className="size-4" />
          </IconButton>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">{open && children}</div>
      </div>
      <style>{`@keyframes pop{from{opacity:0;transform:translateY(8px) scale(.98)}}@keyframes slide-in{from{transform:translateX(40px);opacity:0}}`}</style>
    </dialog>
  );
}

/* ------------------------------ Feedback ------------------------------ */
type Toast = { id: number; text: string; tone: 'ok' | 'error' };
const ToastCtx = createContext<(text: string, tone?: Toast['tone']) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x, { id, text, tone }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-5 z-[100] flex flex-col items-center gap-2 px-4"
      >
        {items.map((i) => (
          <div
            key={i.id}
            className={cx(
              'pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2.5 text-[14px] font-medium shadow-lg animate-[pop_.2s_var(--ease-out)]',
              i.tone === 'ok' ? 'bg-ink text-white dark:bg-raised dark:text-fg' : 'bg-coral text-white',
            )}
          >
            {i.tone === 'ok' && <span className="size-2 rounded-full bg-signal" aria-hidden />}
            {i.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function CopyButton({
  value,
  label,
  className,
  variant = 'secondary',
}: {
  value: string;
  label?: string;
  className?: string;
  variant?: BtnVariant;
}) {
  const [done, setDone] = useState(false);
  const { t } = useT();
  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      className={className}
      onClick={async () => {
        await navigator.clipboard.writeText(value).catch(() => {});
        setDone(true);
        setTimeout(() => setDone(false), 1400);
      }}
    >
      {done ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {done ? t('Copied') : (label ?? t('Copy'))}
    </Button>
  );
}

/** Loading state drawn as QR modules filling in — the brand's one recurring motif. */
export function ModuleLoader({ label, className }: { label?: string; className?: string }) {
  const { t } = useT();
  return (
    <div role="status" className={cx('grid place-items-center gap-3 py-16 text-muted', className)}>
      <div className="grid grid-cols-5 gap-1" aria-hidden>
        {Array.from({ length: 25 }, (_, i) => (
          <span
            key={i}
            className="size-2.5 rounded-[3px] bg-ink/80 dark:bg-accent"
            style={{ animation: `module 1.4s ${(i * 53) % 700}ms infinite var(--ease-out)` }}
          />
        ))}
      </div>
      <span className="text-[13px]">{label ?? t('Loading…')}</span>
      <style>{`@keyframes module{0%,100%{opacity:.12;transform:scale(.7)}40%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

export function Empty({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="module-grid grid place-items-center rounded-[var(--radius-card)] border border-dashed border-line px-6 py-16 text-center">
      <div className="grid max-w-sm justify-items-center gap-3 bg-bg/80 p-2">
        {icon && (
          <div className="grid size-12 place-items-center rounded-xl bg-surface text-accent shadow-sm">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold">{title}</h3>
        {body && <p className="text-[14px] text-muted">{body}</p>}
        {action}
      </div>
    </div>
  );
}

export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  const { t } = useT();
  return (
    <div role="alert" className="card grid justify-items-start gap-3 p-6">
      <h3 className="font-semibold">{t('This view could not load')}</h3>
      <p className="text-[14px] text-muted">{error instanceof Error ? error.message : String(error)}</p>
      {retry && (
        <Button variant="secondary" size="sm" onClick={retry}>
          {t('Try again')}
        </Button>
      )}
    </div>
  );
}

export const PageHeader = ({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div className="grid gap-1">
      <h1 className="text-[28px] font-semibold sm:text-[32px]">{title}</h1>
      {subtitle && <p className="text-[14.5px] text-muted">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);
