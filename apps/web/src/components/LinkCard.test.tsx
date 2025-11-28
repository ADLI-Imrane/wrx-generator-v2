import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import { LinkCard } from '@/components/LinkCard';
import { mockLinks } from '@/test/mocks/api';

describe('LinkCard Component', () => {
  const mockLink = mockLinks[0];
  const defaultProps = {
    link: mockLink,
    onCopy: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onGenerateQR: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render link title', () => {
    render(<LinkCard {...defaultProps} />);

    expect(screen.getByText(mockLink.title!)).toBeInTheDocument();
  });

  it('should render click count', () => {
    render(<LinkCard {...defaultProps} />);

    expect(screen.getByText(`${mockLink.clicks} clics`)).toBeInTheDocument();
  });

  it('should render short URL', () => {
    render(<LinkCard {...defaultProps} />);

    // The short URL should contain the slug
    expect(screen.getByText(/abc123/)).toBeInTheDocument();
  });

  it('should render original URL', () => {
    render(<LinkCard {...defaultProps} />);

    expect(screen.getByText(mockLink.originalUrl)).toBeInTheDocument();
  });

  it('should call onCopy when copy button is clicked', async () => {
    render(<LinkCard {...defaultProps} />);

    // Find and click the copy button
    const copyButton = screen.getByTitle('Copier le lien');
    fireEvent.click(copyButton);

    // Wait for the async operation
    await vi.waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });

  it('should show inactive badge when link is not active', () => {
    render(<LinkCard {...defaultProps} link={{ ...mockLink, isActive: false }} />);

    expect(screen.getByText('Inactif')).toBeInTheDocument();
  });

  it('should not show inactive badge when link is active', () => {
    render(<LinkCard {...defaultProps} />);

    expect(screen.queryByText('Inactif')).not.toBeInTheDocument();
  });

  it('should open context menu when more button is clicked', async () => {
    render(<LinkCard {...defaultProps} />);

    // Find the more button by looking for the MoreVertical icon container
    const buttons = screen.getAllByRole('button');
    // The last button with an SVG is the more button
    const moreButton = buttons[buttons.length - 1];

    expect(moreButton).toBeDefined();
    fireEvent.click(moreButton!);

    // Menu items should appear after click
    await waitFor(() => {
      expect(screen.getByText('Modifier')).toBeInTheDocument();
      expect(screen.getByText('Supprimer')).toBeInTheDocument();
    });
  });
});
