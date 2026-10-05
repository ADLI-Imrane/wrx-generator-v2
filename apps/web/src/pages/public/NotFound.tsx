import { Link } from 'react-router';
import { useT } from '@/lib/i18n';
import { Button } from '@/components/ui';

export default function NotFound() {
  const { t } = useT();
  return (
    <main className="module-grid grid min-h-[70dvh] place-items-center px-6 text-center">
      <div className="grid max-w-md justify-items-center gap-4 bg-bg/85 p-4">
        <p className="font-mono text-[13px] text-faint">404</p>
        <h1 className="text-[34px] font-semibold">{t('This link does not lead anywhere.')}</h1>
        <p className="text-muted">{t('It may have been mistyped, or its owner removed it.')}</p>
        <Link to="/">
          <Button>{t('Go to the home page')}</Button>
        </Link>
      </div>
    </main>
  );
}
