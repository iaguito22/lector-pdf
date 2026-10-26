import { HighlightColor, ReadingMode } from '../types';

export interface ToolbarEvents {
  onToolChange: (tool: 'cursor' | 'highlighter' | 'note') => void;
  onColorChange: (color: HighlightColor) => void;
  onSearchToggle: () => void;
  onTOCToggle: () => void;
  onZoomChange: (delta: number) => void;
  onModeChange: (mode: ReadingMode) => void;
  onZenToggle: (zenActive: boolean) => void;
  onPageJump: (pageNumber: number) => void;
  onOpenFile: () => void;
}

export class MagneticToolbar {
  private element: HTMLElement;
  private activeTool: 'cursor' | 'highlighter' | 'note' = 'cursor';
  private activeColor: HighlightColor = 'yellow';
  private isZenActive = false;
  private zenTimer: number | null = null;
  private curPage = 1;
  private totalPages = 1;

  constructor(private container: HTMLElement, private events: ToolbarEvents) {
    this.element = this.createDOM();
    this.container.appendChild(this.element);
    this.setupListeners();
  }

  getElement(): HTMLElement {
    return this.element;
  }

  setPage(current: number, total: number) {
    this.curPage = current;
    this.totalPages = total;
    const curEl = this.element.querySelector('.page-cur-num');
    const totEl = this.element.querySelector('.page-tot-num');
    if (curEl) curEl.textContent = String(current).padStart(2, '0');
    if (totEl) totEl.textContent = String(total);
  }

  setOrientation(isVertical: boolean, dock: 'left' | 'right' | 'top', coords: { top?: string; left?: string; right?: string; transform: string }) {
    this.element.classList.remove('is-vertical', 'is-horizontal', 'dock-left', 'dock-right', 'dock-top');
    this.element.classList.add(isVertical ? 'is-vertical' : 'is-horizontal', `dock-${dock}`);
    
    if (coords.top) this.element.style.top = coords.top;
    if (coords.left) this.element.style.left = coords.left;
    if (coords.right) this.element.style.right = coords.right;
    this.element.style.transform = coords.transform;
  }

  triggerZenActivity() {
    if (!this.isZenActive) return;
    this.element.classList.remove('zen-dimmed');
    if (this.zenTimer) clearTimeout(this.zenTimer);
    this.zenTimer = window.setTimeout(() => {
      if (this.isZenActive) {
        this.element.classList.add('zen-dimmed');
      }
    }, 2400);
  }

  getActiveTool() {
    return this.activeTool;
  }

  getActiveColor(): HighlightColor {
    return this.activeColor;
  }

  private createDOM(): HTMLElement {
    const nav = document.createElement('nav');
    nav.id = 'adaptive-toolbar';
    nav.className = 'is-vertical dock-left p1-glass';

    nav.innerHTML = `
      <div class="tools-inner">
        <!-- Indicador de Página -->
        <div class="page-pill" title="Página actual · Clic para saltar">
          <span class="page-cur-num">01</span>
          <span class="page-sep">/</span>
          <span class="page-tot-num">01</span>
        </div>

        <div class="tool-sep"></div>

        <!-- Abrir archivo -->
        <button class="tool-btn" id="btn-open-file" data-tip="Abrir PDF (Ctrl+O)">
          <svg class="tool-icon" viewBox="0 0 24 24"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
        </button>

        <!-- Cursor Selección -->
        <button class="tool-btn active" id="btn-tool-cursor" data-tip="Seleccionar texto (V)">
          <svg class="tool-icon" viewBox="0 0 24 24"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>
        </button>

        <!-- Resaltador -->
        <button class="tool-btn" id="btn-tool-hl" data-tip="Resaltador activo (H)">
          <svg class="tool-icon" viewBox="0 0 24 24"><path d="m9 11-6 6v3h3l6-6"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>
        </button>

        <!-- Paleta de Colores de Resaltado -->
        <div class="color-picker-group">
          <div class="color-dot c-yellow active" data-color="yellow" title="Idea principal"></div>
          <div class="color-dot c-cyan" data-color="cyan" title="Definición o término"></div>
          <div class="color-dot c-purple" data-color="purple" title="Fórmula o clave"></div>
          <div class="color-dot c-green" data-color="green" title="Ejemplo práctico"></div>
        </div>

        <div class="tool-sep"></div>

        <!-- Nota al margen -->
        <button class="tool-btn" id="btn-tool-note" data-tip="Nota al margen (N)">
          <svg class="tool-icon" viewBox="0 0 24 24"><path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3z"/><path d="M14 3v6h6"/><path d="M10 13h4"/><path d="M10 17h4"/></svg>
        </button>

        <!-- Buscador -->
        <button class="tool-btn" id="btn-tool-search" data-tip="Buscar en PDF (Ctrl+F)">
          <svg class="tool-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </button>

        <!-- Índice TOC -->
        <button class="tool-btn" id="btn-tool-toc" data-tip="Índice de Capítulos (I)">
          <svg class="tool-icon" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h12"/></svg>
        </button>

        <div class="tool-sep"></div>

        <!-- Zoom Menos -->
        <button class="tool-btn" id="btn-zoom-out" data-tip="Reducir zoom (-)">
          <svg class="tool-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>

        <!-- Zoom Más -->
        <button class="tool-btn" id="btn-zoom-in" data-tip="Aumentar zoom (+)">
          <svg class="tool-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>

        <!-- Modos de Lectura (Ciclo) -->
        <button class="tool-btn" id="btn-tool-mode" data-tip="Modo lectura (M): Luz, Sepia, Noche, OLED, E-ink">
          <svg class="tool-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
        </button>

        <!-- Modo Zen -->
        <button class="tool-btn" id="btn-tool-zen" data-tip="Modo Zen auto-ocultable (Z)">
          <svg class="tool-icon" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
        </button>
      </div>
    `;

    return nav;
  }

  private setupListeners() {
    // Abrir archivo
    this.element.querySelector('#btn-open-file')?.addEventListener('click', () => {
      this.events.onOpenFile();
    });

    // Herramientas principales
    const btnCursor = this.element.querySelector('#btn-tool-cursor');
    const btnHl = this.element.querySelector('#btn-tool-hl');
    const btnNote = this.element.querySelector('#btn-tool-note');

    btnCursor?.addEventListener('click', () => {
      this.setActiveTool('cursor');
      this.events.onToolChange('cursor');
    });

    btnHl?.addEventListener('click', () => {
      this.setActiveTool('highlighter');
      this.events.onToolChange('highlighter');
    });

    btnNote?.addEventListener('click', () => {
      this.setActiveTool('note');
      this.events.onToolChange('note');
    });

    // Colores
    this.element.querySelectorAll('.color-dot').forEach(dot => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        this.element.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        const color = (dot as HTMLElement).dataset.color as HighlightColor;
        this.activeColor = color;
        this.events.onColorChange(color);
        // Si no estaba en resaltador, activarlo
        this.setActiveTool('highlighter');
        this.events.onToolChange('highlighter');
      });
    });

    // Búsqueda y TOC
    this.element.querySelector('#btn-tool-search')?.addEventListener('click', () => {
      this.events.onSearchToggle();
    });
    this.element.querySelector('#btn-tool-toc')?.addEventListener('click', () => {
      this.events.onTOCToggle();
    });

    // Zoom
    this.element.querySelector('#btn-zoom-in')?.addEventListener('click', () => {
      this.events.onZoomChange(0.15);
    });
    this.element.querySelector('#btn-zoom-out')?.addEventListener('click', () => {
      this.events.onZoomChange(-0.15);
    });

    // Modos de color
    const modes: ReadingMode[] = ['light', 'sepia', 'dark', 'oled', 'eink'];
    let modeIdx = 0;
    this.element.querySelector('#btn-tool-mode')?.addEventListener('click', () => {
      modeIdx = (modeIdx + 1) % modes.length;
      this.events.onModeChange(modes[modeIdx]);
    });

    // Modo Zen
    const btnZen = this.element.querySelector('#btn-tool-zen');
    btnZen?.addEventListener('click', () => {
      this.isZenActive = !this.isZenActive;
      btnZen.classList.toggle('active', this.isZenActive);
      this.element.classList.toggle('zen-mode', this.isZenActive);
      this.events.onZenToggle(this.isZenActive);
      if (this.isZenActive) {
        this.triggerZenActivity();
      } else {
        this.element.classList.remove('zen-dimmed');
      }
    });

    // Salto de página
    this.element.querySelector('.page-pill')?.addEventListener('click', () => {
      const p = prompt(`Ir a la página (1 a ${this.totalPages}):`, String(this.curPage));
      if (p) {
        const num = parseInt(p, 10);
        if (!isNaN(num) && num >= 1 && num <= this.totalPages) {
          this.events.onPageJump(num);
        }
      }
    });

    // Despertar Zen al hacer hover
    this.element.addEventListener('mouseenter', () => {
      this.triggerZenActivity();
    });
  }

  private setActiveTool(tool: 'cursor' | 'highlighter' | 'note') {
    this.activeTool = tool;
    this.element.querySelector('#btn-tool-cursor')?.classList.toggle('active', tool === 'cursor');
    this.element.querySelector('#btn-tool-hl')?.classList.toggle('active', tool === 'highlighter');
    this.element.querySelector('#btn-tool-note')?.classList.toggle('active', tool === 'note');
  }
}
