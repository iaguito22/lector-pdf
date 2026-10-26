import { DockCalculationResult, MarginMetrics } from '../types';

export const MIN_SIDE_MARGIN = 68; // Anchura necesaria para barra lateral + margen de seguridad

export function calculateDocking(
  metrics: MarginMetrics,
  pillWidth = 54,
  horizontalPillHeight = 46
): DockCalculationResult {
  const { marginLeft, marginRight, marginTop, docWidth, docHeight } = metrics;
  const aspectRatio = docHeight > 0 ? docWidth / docHeight : 0.7;

  let dock: 'left' | 'right' | 'top';

  // Regla 1: Si no cabe en los laterales, forzar arriba (horizontal)
  if (marginLeft < MIN_SIDE_MARGIN && marginRight < MIN_SIDE_MARGIN) {
    dock = 'top';
  }
  // Regla 2: Si el documento es apaisado (aspectRatio > 1.22) y hay al menos 54px arriba
  else if (marginTop >= 54 && (aspectRatio > 1.22 || (marginTop > marginLeft && marginTop > marginRight))) {
    dock = 'top';
  }
  // Regla 3: Lateral con más espacio libre
  else {
    dock = marginRight > marginLeft + 24 ? 'right' : 'left';
  }

  if (dock === 'top') {
    const vTop = metrics.viewportTop || 0;
    const topPos = vTop + Math.max(12, Math.floor((marginTop - horizontalPillHeight) / 2));
    return {
      dock,
      isVertical: false,
      coords: {
        top: `${topPos}px`,
        left: '50%',
        right: 'auto',
        transform: 'translateX(-50%)',
      },
    };
  }

  if (dock === 'right') {
    const rightPos = Math.max(12, Math.floor((marginRight - pillWidth) / 2));
    return {
      dock,
      isVertical: true,
      coords: {
        top: '50%',
        right: `${rightPos}px`,
        left: 'auto',
        transform: 'translateY(-50%)',
      },
    };
  }

  // dock === 'left'
  const leftPos = Math.max(12, Math.floor((marginLeft - pillWidth) / 2));
  return {
    dock,
    isVertical: true,
    coords: {
      top: '50%',
      left: `${leftPos}px`,
      right: 'auto',
      transform: 'translateY(-50%)',
    },
  };
}
