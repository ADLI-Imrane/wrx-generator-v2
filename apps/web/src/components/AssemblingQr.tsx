import { useMemo } from 'react';
import qrcode from 'qrcode-generator';

/**
 * The landing page's one orchestrated moment: modules of a real, scannable QR code
 * settle into place in a pseudo-random order whenever the encoded text changes.
 */
export function AssemblingQr({ text, size = 280 }: { text: string; size?: number }) {
  const { n, cells } = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(text || 'https://wrx.app');
    qr.make();
    const n = qr.getModuleCount();
    const cells: { x: number; y: number; d: number; finder: boolean }[] = [];
    const inFinder = (x: number, y: number) =>
      (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++)
        if (qr.isDark(y, x))
          cells.push({
            x,
            y,
            finder: inFinder(x, y),
            d: inFinder(x, y) ? 0 : ((x * 7919 + y * 104729) % 997) / 997,
          });
    return { n, cells };
  }, [text]);
  const q = 2; // quiet zone
  return (
    <svg
      key={text}
      viewBox={`${-q} ${-q} ${n + q * 2} ${n + q * 2}`}
      width={size}
      height={size}
      role="img"
      aria-label="QR code preview"
      className="block rounded-2xl bg-white"
    >
      {cells.map((c) => (
        <rect
          key={`${c.x}-${c.y}`}
          x={c.x + 0.06}
          y={c.y + 0.06}
          width={0.88}
          height={0.88}
          rx={c.finder ? 0.12 : 0.32}
          fill={c.finder ? '#14213D' : '#2B3A5C'}
          style={{
            transformBox: 'fill-box',
            transformOrigin: 'center',
            animation: `qr-in .55s ${(c.d * 900).toFixed(0)}ms both var(--ease-out)`,
          }}
        />
      ))}
      <style>{`@keyframes qr-in{from{opacity:0;transform:scale(.2)}}`}</style>
    </svg>
  );
}
