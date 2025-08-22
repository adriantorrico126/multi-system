import React from 'react';
import { Button } from '@/components/ui/button';
import { useOrientation } from '@/hooks/useOrientation';

export function OrientationBanner() {
  const { orientation, requestLandscape } = useOrientation();

  const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (!isMobile) return null;

  if (orientation === 'landscape') return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[120] p-3">
      <div className="mx-auto max-w-md bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-xl shadow-lg p-3 flex items-center justify-between gap-3">
        <div className="text-sm">
          Para una mejor experiencia, gira tu dispositivo o toca "Usar horizontal".
        </div>
        <Button size="sm" onClick={requestLandscape}>Usar horizontal</Button>
      </div>
    </div>
  );
}


