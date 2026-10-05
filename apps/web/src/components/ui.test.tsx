import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nProvider } from '@/lib/i18n';
import { BarList } from './charts';
import { Segmented, Switch } from './ui';

const wrap = (ui: ReactNode) => render(<I18nProvider>{ui}</I18nProvider>);

describe('BarList', () => {
  it('shows values with their share of the total', () => {
    wrap(
      <BarList
        items={[
          { key: 'mobile', value: 3 },
          { key: 'desktop', value: 1 },
        ]}
      />,
    );
    expect(screen.getByText('mobile')).toBeInTheDocument();
    expect(screen.getByText('· 75%')).toBeInTheDocument();
  });
  it('explains an empty state', () => {
    wrap(<BarList items={[]} empty="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });
});

describe('Switch and Segmented', () => {
  it('exposes accessible roles and reports changes', async () => {
    const onSwitch = vi.fn();
    const onSeg = vi.fn();
    wrap(
      <>
        <Switch checked={false} onChange={onSwitch} label="Remote possible" />
        <Segmented
          label="Period"
          value="7d"
          onChange={onSeg}
          options={[
            { value: '7d', label: '7 days' },
            { value: '30d', label: '30 days' },
          ]}
        />
      </>,
    );
    await userEvent.click(screen.getByRole('switch', { name: 'Remote possible' }));
    expect(onSwitch).toHaveBeenCalledWith(true);
    expect(screen.getByRole('radio', { name: '7 days' })).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(screen.getByRole('radio', { name: '30 days' }));
    expect(onSeg).toHaveBeenCalledWith('30d');
  });
});
