import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  BarChart3,
  Briefcase,
  Compass,
  IdCard,
  Inbox,
  Link2,
  Plus,
  QrCode,
  Settings,
  CornerDownLeft,
} from 'lucide-react';
import { useT } from '@/lib/i18n';
import { useLinks } from '@/hooks/queries';
import { cx } from './ui';

/** ⌘K: jump anywhere, or search your links by slug, title or destination. */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useT();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const links = useLinks({ q: q || undefined, limit: 6 });

  useEffect(() => {
    if (open) {
      setQ('');
      setSel(0);
      setTimeout(() => input.current?.focus(), 10);
    }
  }, [open]);

  const items = useMemo(() => {
    const pages = [
      { label: t('Create a link'), icon: <Plus />, to: '/app/links?new=1' },
      { label: t('Design a QR code'), icon: <QrCode />, to: '/app/qr?new=1' },
      { label: t('Overview'), icon: <BarChart3 />, to: '/app' },
      { label: t('Links'), icon: <Link2 />, to: '/app/links' },
      { label: t('Profile & card'), icon: <IdCard />, to: '/app/profile' },
      { label: t('Opportunities'), icon: <Briefcase />, to: '/app/opportunities' },
      { label: t('Inbox'), icon: <Inbox />, to: '/app/inbox' },
      { label: t('Discover people and startups'), icon: <Compass />, to: '/discover' },
      { label: t('Settings'), icon: <Settings />, to: '/app/settings' },
    ].filter((p) => !q || p.label.toLowerCase().includes(q.toLowerCase()));
    const found = q
      ? (links.data?.items ?? []).map((l) => ({
          label: l.title || `/${l.slug}`,
          hint: `/${l.slug}`,
          icon: <Link2 />,
          to: `/app/links/${l.id}`,
        }))
      : [];
    return [...found, ...pages];
  }, [q, links.data, t]);

  if (!open) return null;
  const go = (to: string) => {
    onClose();
    nav(to);
  };

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-start bg-ink/40 px-3 pt-[12vh] backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={t('Command palette')}
        className="mx-auto w-full max-w-xl overflow-hidden rounded-[18px] border border-line bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={input}
          value={q}
          placeholder={t('Type a command or search your links…')}
          onChange={(e) => {
            setQ(e.target.value);
            setSel(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setSel((s) => Math.min(items.length - 1, s + 1));
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setSel((s) => Math.max(0, s - 1));
            }
            if (e.key === 'Enter' && items[sel]) go(items[sel].to);
          }}
          className="h-14 w-full border-b border-line bg-transparent px-5 text-[16px] outline-none placeholder:text-faint"
          aria-label={t('Search')}
        />
        <ul className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
          {items.map((it, i) => (
            <li key={it.to + i} role="option" aria-selected={i === sel}>
              <button
                onMouseEnter={() => setSel(i)}
                onClick={() => go(it.to)}
                className={cx(
                  'flex h-11 w-full items-center gap-3 rounded-[10px] px-3 text-left text-[14px] [&_svg]:size-4 [&_svg]:text-faint',
                  i === sel && 'bg-raised',
                )}
              >
                {it.icon}
                <span className="flex-1 truncate">{it.label}</span>
                {'hint' in it && (
                  <span className="font-mono text-[12px] text-faint">{(it as { hint: string }).hint}</span>
                )}
                {i === sel && <CornerDownLeft />}
              </button>
            </li>
          ))}
          {!items.length && (
            <li className="px-3 py-6 text-center text-[13px] text-faint">
              {t('Nothing matches “{q}”', { q })}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
