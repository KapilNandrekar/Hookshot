// Adapted from React Bits' "counter" visual pattern, hand-written
// (not pulled from their live registry — see chat note). Animates a
// number counting up to its target whenever the value changes.
import { useEffect, useRef, useState } from 'react';

export default function AnimatedNumber({ value, suffix = '', duration = 600 }) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
      return;
    }
    const from = fromRef.current;
    const to = Number(value) || 0;
    const start = performance.now();

    let raf;
    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span>{display}{suffix}</span>;
}