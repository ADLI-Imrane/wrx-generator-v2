/** True when the head script enabled motion (no reduced-motion preference, JS running). */
export function motionAllowed(): boolean {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('motion');
}

export function finePointer(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches
  );
}
