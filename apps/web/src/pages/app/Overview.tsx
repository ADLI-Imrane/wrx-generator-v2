import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { useMe } from '@/hooks/queries';
import { AnalyticsPanel } from '@/components/AnalyticsPanel';
import { PageHeader, Button } from '@/components/ui';
import { QuickCreate } from './Links';

export default function Overview() {
  const { t } = useT();
  const me = useMe();
  const [open, setOpen] = useState(false);
  const hour = new Date().getHours();
  const greet = hour < 12 ? t('Good morning') : hour < 18 ? t('Good afternoon') : t('Good evening');
  return (
    <>
      <PageHeader
        title={`${greet}, ${me.data?.name.split(' ')[0] ?? ''}`}
        subtitle={t('Here is how your links are doing.')}
        actions={<Button onClick={() => setOpen(true)}>{t('Create a link')}</Button>}
      />
      <AnalyticsPanel />
      <QuickCreate open={open} onClose={() => setOpen(false)} />
    </>
  );
}
