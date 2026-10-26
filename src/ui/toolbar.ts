import { ReadingMode } from '../types';

export interface ToolbarEvents {
  onSearchToggle: () => void;
  onTOCToggle: () => void;
  onZoomChange: (delta: number) => void;
  onFitPage: () => void;
  onFitWidth: () => void;
  onModeChange: (mode: ReadingMode) => void;
  onZenToggle: (zenActive: boolean) => void;
  onPageJump: (pageNumber: number) => void;
  onOpenFile: () => void;
}

export class MagneticToolbar {
  private element: HTMLElement;
  private isZenActive = false;
  private zenTimer: number | null = null;
  private curPage = 1;
  private totalPages = 1;
  private isUserTypingPage = false;

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

    const pageInput = this.element.querySelector<HTMLInputElement>('#page-num-input');
    const totEl = this.element.querySelector('.page-tot-num');

    // No sobreescribir si el usuario está tecleando ahora mismo en el input
    if (pageInput && !this.isUserTypingPage) {
      pageInput.value = String(current);
    }
    if (totEl) {
      totEl.textContent = String(total);
    }
  }

  setZoomLabel(label: string) {
    const zoomEl = this.element.querySelector('#zoom-indicator');
    if (zoomEl) zoomEl.textContent = label;
  }

  setOrientation(
    isVertical: boolean,
    dock: 'left' | 'right' | 'top',
    coords: { top?: string; left?: string; right?: string; transform: string }
  ) {
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

  focusPageInput() {
    const input = this.element.querySelector<HTMLInputElement>('#page-num-input');
    if (input) {
      input.focus();
      input.select();
    }
  }

  private createDOM(): HTMLElement {
    const nav = document.createElement('nav');
    nav.id = 'adaptive-toolbar';
    nav.className = 'is-vertical dock-left p1-glass';

    nav.innerHTML = `
      <div class="tools-inner">
        <!-- 1. NAVEGACIÓN Y DIAPOSITIVA (Input numérico directo) -->
        <div class="page-pill" title="Escribe un número de diapositiva y pulsa Enter (G)">
          <input
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            id="page-num-input"
            class="page-num-input"
            value="1"
            aria-label="Número de diapositiva"
          />
          <span class="page-sep">/</span>
          <span class="page-tot-num">1</span>
        </div>

        <!-- Índice de Capítulos (TOC) -->
        <button class="tool-btn" id="btn-tool-toc" data-tip="Índice de capítulos (I)">
          <svg class="tool-icon" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h12"/></svg>
        </button>

        <!-- Buscador en texto -->
        <button class="tool-btn" id="btn-tool-search" data-tip="Buscar en diapositivas (Ctrl+F)">
          <svg class="tool-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </button>

        <!-- Abrir archivo -->
        <button class="tool-btn" id="btn-open-file" data-tip="Abrir otro PDF (Ctrl+O)">
          <svg class="tool-icon" viewBox="0 0 24 24"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
        </button>

        <div class="tool-sep"></div>

        <!-- 2. ZOOM Y ENCAJE DE PANTALLA -->
        <!-- Ajustar a la Página (Completa) -->
        <button class="tool-btn" id="btn-fit-page" data-tip="Ajustar a la página (P / 0)">
          <svg class="tool-icon" viewBox="0 0 24 24"><rect width="14" height="18" x="5" y="3" rx="2"/><path d="M9 7h6M9 17h6"/></svg>
        </button>

        <!-- Ajustar al Ancho -->
        <button class="tool-btn" id="btn-fit-width" data-tip="Ajustar al ancho (W)">
          <svg class="tool-icon" viewBox="0 0 24 24"><rect width="18" height="14" x="3" y="5" rx="2"/><path d="m7 12 2.5-2.5m-2.5 2.5 2.5 2.5m7.5-2.5-2.5-2.5m2.5 2.5-2.5 2.5"/></svg>
        </button>

        <!-- Indicador de Zoom -->
        <div class="zoom-pill" id="zoom-indicator" title="Zoom actual">Fit</div>

        <!-- Zoom Menos -->
        <button class="tool-btn" id="btn-zoom-out" data-tip="Reducir zoom (-)">
          <svg class="tool-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>

        <!-- Zoom Más -->
        <button class="tool-btn" id="btn-zoom-in" data-tip="Aumentar zoom (+)">
          <svg class="tool-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>

        <div class="tool-sep"></div>

        <!-- 3. CONFORT Y MODOS DE VISUALIZACIÓN -->
        <!-- Ciclo de Modos de Lectura (Luz, Sepia, Noche, OLED, E-ink) -->
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
    const pageInput = this.element.querySelector<HTMLInputElement>('#page-num-input');

    const handleJumpSubmit = () => {
      if (!pageInput) return;
      let val = parseInt(pageInput.value.replace(/\D/g, ''), 10);
      if (!isNaN(val)) {
        val = Math.max(1, Math.min(this.totalPages, val));
        this.events.onPageJump(val);
        pageInput.value = String(val);
      } else {
        pageInput.value = String(this.curPage);
      }
      this.isUserTypingPage = false;
      pageInput.blur();
    };

    if (pageInput) {
      pageInput.addEventListener('focus', () => {
        this.isUserTypingPage = true;
        setTimeout(() => pageInput.select(), 10);
      });

      pageInput.addEventListener('click', () => {
        pageInput.select();
      });

      pageInput.addEventListener('blur', () => {
        handleJumpSubmit();
      });

      pageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleJumpSubmit();
        } else if (e.key === 'Escape') {
          pageInput.value = String(this.curPage);
          pageInput.blur();
          this.isUserTypingPage = false;
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
          e.preventDefault();
          const next = Math.min(this.totalPages, this.curPage + 1);
          this.events.onPageJump(next);
          pageInput.value = String(next);
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const prev = Math.max(1, this.curPage - 1);
          this.events.onPageJump(prev);
          pageInput.value = String(prev);
        }
      });
    }

    // Abrir archivo
    this.element.querySelector('#btn-open-file')?.addEventListener('click', () => {
      this.events.onOpenFile();
    });

    // Búsqueda y TOC
    this.element.querySelector('#btn-tool-search')?.addEventListener('click', () => {
      this.events.onSearchToggle();
    });
    this.element.querySelector('#btn-tool-toc')?.addEventListener('click', () => {
      this.events.onTOCToggle();
    });

    // Zoom y Ajuste
    this.element.querySelector('#btn-fit-page')?.addEventListener('click', () => {
      this.events.onFitPage();
    });
    this.element.querySelector('#btn-fit-width')?.addEventListener('click', () => {
      this.events.onFitWidth();
    });
    this.element.querySelector('#btn-zoom-in')?.addEventListener('click', () => {
      this.events.onZoomChange(0.15);
    });
    this.element.querySelector('#btn-zoom-out')?.addEventListener('click', () => {
      this.events.onZoomChange(-0.15);
    });

    // Modos de lectura
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

    // Despertar Zen al hacer hover
    this.element.addEventListener('mouseenter', () => {
      this.triggerZenActivity();
    });
  }
}
