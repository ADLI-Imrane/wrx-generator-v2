type BrandLogoSize = 'compact' | 'auth' | 'landing' | 'footer';

interface BrandLogoProps {
  size?: BrandLogoSize;
  alt?: string;
  className?: string;
}

const dimensions: Record<BrandLogoSize, [number, number]> = {
  compact: [36, 28],
  auth: [68, 52],
  landing: [54, 42],
  footer: [64, 48],
};

export function BrandLogo({ size = 'compact', alt = 'WRX Generator', className = '' }: BrandLogoProps) {
  const [width, height] = dimensions[size];

  return (
    <img
      src="/brand/wrx-logo.png"
      alt={alt}
      width={width}
      height={height}
      draggable={false}
      className={`block shrink-0 object-contain ${className}`.trim()}
    />
  );
}
