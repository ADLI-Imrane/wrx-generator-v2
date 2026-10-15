import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomePage } from './HomePage';
import { homeCopy } from './content';

vi.mock('./proof', () => ({
  proofLogos: [{ name: 'Client', src: '/client.svg', width: 120, height: 32 }],
  proofQuotes: [],
}));

describe('proof slot once logos are provided', () => {
  it('renders the logos once for assistive tech and offers a pause control', async () => {
    const user = userEvent.setup();
    const { container } = render(<HomePage copy={homeCopy.fr} />);
    expect(screen.getAllByRole('img', { name: 'Client' })).toHaveLength(1);
    const toggle = screen.getByRole('button', { name: homeCopy.fr.payoff.pause });
    await user.click(toggle);
    expect(screen.getByRole('button', { name: homeCopy.fr.payoff.play })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(container.querySelector('.h-marquee')).toHaveAttribute('data-paused', 'true');
  });
});
