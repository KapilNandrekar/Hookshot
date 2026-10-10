const DURATION = 700; // ms

export function themeTransition({ origin, apply, duration = DURATION }) {
  const root = document.documentElement;

  if (root.dataset.themeVt === 'active') return; // already animating

  // Browsers without View Transitions, or reduced-motion users: switch instantly
  if (
    typeof document.startViewTransition !== 'function' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    apply();
    return;
  }

  const w = window.innerWidth;
  const h = window.innerHeight;
  const x = origin?.x ?? w / 2;
  const y = origin?.y ?? h / 2;
  const maxRadius = Math.hypot(Math.max(x, w - x), Math.max(y, h - y));

  // Percentages (not px) so the circle lands correctly on fractional display scales
  const at = `${(x / w) * 100}% ${(y / h) * 100}%`;
  const radius = `${(maxRadius / (Math.hypot(w, h) / Math.SQRT2)) * 100}%`;
  const clipPath = [`circle(0% at ${at})`, `circle(${radius} at ${at})`];

  root.dataset.themeVt = 'active';
  root.style.setProperty('--theme-vt-duration', `${duration}ms`);
  root.style.setProperty('--theme-vt-clip-from', clipPath[0]);

  const cleanup = () => {
    delete root.dataset.themeVt;
    root.style.removeProperty('--theme-vt-duration');
    root.style.removeProperty('--theme-vt-clip-from');
  };

  const transition = document.startViewTransition(apply);
  transition.finished.finally(cleanup).catch(() => {});

  transition.ready
    .then(() => {
      root.animate(
        { clipPath },
        {
          duration,
          easing: 'ease-in-out',
          fill: 'forwards',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    })
    .catch(() => {});
}