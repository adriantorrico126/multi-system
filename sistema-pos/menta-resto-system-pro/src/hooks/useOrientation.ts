import { useEffect, useState } from 'react';

type Orientation = 'portrait' | 'landscape';

export function useOrientation() {
  const getOrientation = (): Orientation => {
    if (typeof window === 'undefined') return 'portrait';
    const o = (screen.orientation && screen.orientation.type) || (window as any).orientation;
    if (typeof o === 'string') return o.includes('landscape') ? 'landscape' : 'portrait';
    if (typeof o === 'number') return Math.abs(o) === 90 ? 'landscape' : 'portrait';
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  };

  const [orientation, setOrientation] = useState<Orientation>(getOrientation());

  useEffect(() => {
    const onChange = () => setOrientation(getOrientation());
    if (screen.orientation && screen.orientation.addEventListener) {
      screen.orientation.addEventListener('change', onChange);
    } else {
      window.addEventListener('orientationchange', onChange);
      window.addEventListener('resize', onChange);
    }
    return () => {
      if (screen.orientation && screen.orientation.removeEventListener) {
        screen.orientation.removeEventListener('change', onChange);
      } else {
        window.removeEventListener('orientationchange', onChange);
        window.removeEventListener('resize', onChange);
      }
    };
  }, []);

  const requestLandscape = async () => {
    try {
      if (screen.orientation && (screen.orientation as any).lock) {
        await (screen.orientation as any).lock('landscape');
      }
    } catch (_) {
      // Silenciar si no es soportado o no es por user gesture
    }
  };

  return { orientation, requestLandscape };
}


