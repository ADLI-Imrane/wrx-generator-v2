import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';
import { QRCard } from '@/components/QRCard';
import { mockQRCodes } from '@/test/mocks/api';

describe('QRCard Component', () => {
  const mockQR = mockQRCodes[0];
  const defaultProps = {
    qr: mockQR,
    onDownload: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onDuplicate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render QR title', () => {
    render(<QRCard {...defaultProps} />);

    expect(screen.getByText(mockQR.title!)).toBeInTheDocument();
  });

  it('should render QR type badge', () => {
    render(<QRCard {...defaultProps} />);

    expect(screen.getByText('URL')).toBeInTheDocument();
  });

  it('should render scan count', () => {
    render(<QRCard {...defaultProps} />);

    expect(screen.getByText(`${mockQR.scans} scans`)).toBeInTheDocument();
  });

  it('should render WiFi type correctly', () => {
    render(<QRCard {...defaultProps} qr={mockQRCodes[1]} />);

    expect(screen.getByText('WiFi')).toBeInTheDocument();
  });

  it('should open context menu when more button is clicked', () => {
    render(<QRCard {...defaultProps} />);

    // Find and click the more button
    const moreButtons = screen.getAllByRole('button');
    const moreButton = moreButtons[moreButtons.length - 1]; // Last button should be more

    fireEvent.click(moreButton);

    // Menu items should appear
    expect(screen.getByText('Modifier')).toBeInTheDocument();
    expect(screen.getByText('Dupliquer')).toBeInTheDocument();
    expect(screen.getByText('Supprimer')).toBeInTheDocument();
  });

  it('should show download options in menu', () => {
    render(<QRCard {...defaultProps} />);

    // Open the menu
    const moreButtons = screen.getAllByRole('button');
    fireEvent.click(moreButtons[moreButtons.length - 1]);

    // Download options should appear
    expect(screen.getByText('PNG')).toBeInTheDocument();
    expect(screen.getByText('SVG')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });

  it('should call onDownload with correct format', () => {
    render(<QRCard {...defaultProps} />);

    // Open the menu
    const moreButtons = screen.getAllByRole('button');
    fireEvent.click(moreButtons[moreButtons.length - 1]);

    // Click PNG download
    fireEvent.click(screen.getByText('PNG'));

    expect(defaultProps.onDownload).toHaveBeenCalledWith(mockQR, 'png');
  });

  it('should call onEdit when edit is clicked', () => {
    render(<QRCard {...defaultProps} />);

    // Open the menu
    const moreButtons = screen.getAllByRole('button');
    fireEvent.click(moreButtons[moreButtons.length - 1]);

    // Click edit
    fireEvent.click(screen.getByText('Modifier'));

    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockQR);
  });

  it('should call onDuplicate when duplicate is clicked', () => {
    render(<QRCard {...defaultProps} />);

    // Open the menu
    const moreButtons = screen.getAllByRole('button');
    fireEvent.click(moreButtons[moreButtons.length - 1]);

    // Click duplicate
    fireEvent.click(screen.getByText('Dupliquer'));

    expect(defaultProps.onDuplicate).toHaveBeenCalledWith(mockQR);
  });

  it('should call onDelete when delete is clicked', () => {
    render(<QRCard {...defaultProps} />);

    // Open the menu
    const moreButtons = screen.getAllByRole('button');
    fireEvent.click(moreButtons[moreButtons.length - 1]);

    // Click delete
    fireEvent.click(screen.getByText('Supprimer'));

    expect(defaultProps.onDelete).toHaveBeenCalledWith(mockQR);
  });
});
