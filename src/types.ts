export type DockPosition = 'left' | 'right' | 'top';

export type ReadingMode = 'light' | 'sepia' | 'dark' | 'oled' | 'eink';

export type HighlightColor = 'yellow' | 'cyan' | 'purple' | 'green';

export interface NormalizedRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface HighlightAnnotation {
  id: string;
  pageNumber: number;
  color: HighlightColor;
  text: string;
  rects: NormalizedRect[];
  createdAt: number;
}

export interface MarginNote {
  id: string;
  pageNumber: number;
  x: number; // 0..1
  y: number; // 0..1
  text: string;
  color: HighlightColor;
  createdAt: number;
}

export interface TOCItem {
  title: string;
  pageNumber: number;
  children?: TOCItem[];
}

export interface SearchMatch {
  pageNumber: number;
  matchIndex: number;
  snippet: string;
}

export interface MarginMetrics {
  marginLeft: number;
  marginRight: number;
  marginTop: number;
  marginBottom: number;
  docWidth: number;
  docHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  viewportTop?: number;
}

export interface DockCalculationResult {
  dock: DockPosition;
  isVertical: boolean;
  coords: {
    top?: string;
    left?: string;
    right?: string;
    transform: string;
  };
}
