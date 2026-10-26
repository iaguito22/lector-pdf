import { describe, it, expect } from 'vitest';
import { calculateDocking } from '../src/ui/magnetic-dock';
import { MarginMetrics } from '../src/types';

describe('calculateDocking', () => {
  it('debe anclar a la izquierda cuando hay amplio margen lateral en documento vertical', () => {
    const metrics: MarginMetrics = {
      marginLeft: 220,
      marginRight: 220,
      marginTop: 30,
      marginBottom: 30,
      docWidth: 600,
      docHeight: 850,
      viewportWidth: 1040,
      viewportHeight: 910,
    };

    const res = calculateDocking(metrics);
    expect(res.dock).toBe('left');
    expect(res.isVertical).toBe(true);
    expect(res.coords.transform).toBe('translateY(-50%)');
  });

  it('debe anclar a la derecha si el margen derecho es notablemente mayor', () => {
    const metrics: MarginMetrics = {
      marginLeft: 70,
      marginRight: 250,
      marginTop: 20,
      marginBottom: 20,
      docWidth: 600,
      docHeight: 850,
      viewportWidth: 920,
      viewportHeight: 890,
    };

    const res = calculateDocking(metrics);
    expect(res.dock).toBe('right');
    expect(res.isVertical).toBe(true);
  });

  it('debe anclar arriba horizontalmente si el documento es apaisado (slides)', () => {
    const metrics: MarginMetrics = {
      marginLeft: 40,
      marginRight: 40,
      marginTop: 140,
      marginBottom: 140,
      docWidth: 960,
      docHeight: 540, // 16:9 apaisado
      viewportWidth: 1040,
      viewportHeight: 820,
    };

    const res = calculateDocking(metrics);
    expect(res.dock).toBe('top');
    expect(res.isVertical).toBe(false);
    expect(res.coords.transform).toBe('translateX(-50%)');
  });

  it('debe anclar arriba si no cabe en los laterales (ajustar al ancho)', () => {
    const metrics: MarginMetrics = {
      marginLeft: 15,
      marginRight: 15,
      marginTop: 60,
      marginBottom: 60,
      docWidth: 980,
      docHeight: 800,
      viewportWidth: 1010,
      viewportHeight: 920,
    };

    const res = calculateDocking(metrics);
    expect(res.dock).toBe('top');
    expect(res.isVertical).toBe(false);
  });
});
