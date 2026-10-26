import './styles/app.css';
import { PDFViewerEngine } from './core/pdf-renderer';
import { MagneticToolbar } from './ui/toolbar';
import { calculateDocking } from './ui/magnetic-dock';
import { AnnotationManager } from './features/annotations';
import { TOCSearchPanels } from './features/toc-search-panels';
import { ReadingModesManager } from './features/reading-modes';
import { MarginMetrics } from './types';

class LectorPDFApp {
  private pdfEngine = new PDFViewerEngine();
  private annotationManager = new AnnotationManager();
  private readingModes = new ReadingModesManager();
  private toolbar!: MagneticToolbar;
  private panels!: TOCSearchPanels;

  private viewportEl = document.getElementById('app-viewport') as HTMLElement;
  private pagesContainer = document.getElementById('pages-container') as HTMLElement;
  private welcomeEl = document.getElementById('welcome-dropzone') as HTMLElement;
  private docTitleEl = document.getElementById('header-title');
  private fileInput = document.getElementById('file-input') as HTMLInputElement;

  private currentDocId = 'default';
  private currentPage = 1;
  private totalPages = 0;
  private currentFitMode: 'width' | 'page' | 'free' = 'width';

  constructor() {
    this.setupSystemTheme();
    this.initUI();
    this.setupDropzone();
    this.setupResizeAndScroll();
    this.setupKeyboardShortcuts();
  }

  private setupSystemTheme() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const update = (isDark: boolean) => {
      document.body.dataset.systemTheme = isDark ? 'dark' : 'light';
    };
    update(mediaQuery.matches);
    mediaQuery.addEventListener('change', (e) => update(e.matches));
  }

  getCurrentDocId(): string {
    return this.currentDocId;
  }

  private initUI() {
    // 1. Barra Magnética (Píldora Caelestia Glass)
    this.toolbar = new MagneticToolbar(document.body, {
      onSearchToggle: () => {
        this.panels.toggleSearch();
      },
      onTOCToggle: () => {
        this.panels.toggleTOC();
      },
      onZoomChange: (delta) => {
        this.applyZoom(this.pdfEngine.getScale() + delta);
      },
      onFitPage: () => {
        this.fitToPage();
      },
      onFitWidth: () => {
        this.fitToWidth();
      },
      onModeChange: (mode) => {
        this.readingModes.setMode(mode);
      },
      onZenToggle: (zenActive) => {
        if (zenActive) this.toolbar.triggerZenActivity();
      },
      onPageJump: (pageNumber) => {
        this.jumpToPage(pageNumber);
      },
      onOpenFile: () => {
        this.fileInput.click();
      },
    });

    // 2. Paneles de TOC y Buscador
    this.panels = new TOCSearchPanels(
      document.body,
      (page) => this.jumpToPage(page)
    );

    this.panels.onSearchInput(async (query) => {
      if (query.trim().length >= 2) {
        const results = await this.pdfEngine.search(query);
        this.panels.setSearchResults(results, query);
      } else {
        this.panels.setSearchResults([], query);
      }
    });

    // 3. File Input nativo
    this.fileInput.addEventListener('change', async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        await this.loadFromFile(files[0]);
      }
    });

    // Ocultar la barra hasta que haya un documento
    this.toolbar.getElement().style.display = 'none';
  }

  async loadFromFile(file: File) {
    const buffer = await file.arrayBuffer();
    this.currentDocId = file.name;
    this.annotationManager.setDocumentId(file.name);
    await this.renderDocument(buffer, file.name);
  }

  async loadFromUrl(url: string, title: string) {
    this.currentDocId = title;
    this.annotationManager.setDocumentId(title);
    await this.renderDocument(url, title);
  }

  private async renderDocument(source: string | ArrayBuffer, title: string) {
    this.welcomeEl.style.display = 'none';
    this.pagesContainer.style.display = 'flex';
    this.pagesContainer.innerHTML = '';
    if (this.docTitleEl) this.docTitleEl.textContent = title;
    document.title = `${title} · Lector PDF`;

    const info = await this.pdfEngine.load(source);
    this.totalPages = info.numPages;
    this.toolbar.setPage(1, this.totalPages);
    this.toolbar.getElement().style.display = 'flex';

    // Cargar índice (TOC)
    const toc = await this.pdfEngine.extractTOC();
    this.panels.setTOC(toc);

    // Crear contenedores para todas las páginas
    for (let p = 1; p <= this.totalPages; p++) {
      const pageWrapper = document.createElement('div');
      pageWrapper.className = 'pdf-page-wrapper';
      pageWrapper.id = `page-${p}`;
      this.pagesContainer.appendChild(pageWrapper);

      // Renderizar página inicial
      await this.pdfEngine.renderPage(p, pageWrapper);
      const annotLayer = pageWrapper.querySelector('.pdf-custom-annotation-layer') as HTMLElement;
      if (annotLayer) {
        this.annotationManager.renderAnnotationsForPage(p, annotLayer);
      }
    }

    // Ajustar automáticamente al ancho por defecto (máximo espacio útil)
    this.currentFitMode = 'width';
    await this.fitToWidth();
    setTimeout(() => this.updateMagneticDock(), 60);
  }

  async fitToPage() {
    if (this.totalPages === 0) return;
    this.currentFitMode = 'page';
    const orig = await this.pdfEngine.getPageOriginalSize(this.currentPage);
    const vRect = this.viewportEl.getBoundingClientRect();

    // Altura utilizable de la pantalla
    const availableHeight = Math.max(300, vRect.height - 60);
    // Ancho utilizable dejando espacio libre para la barra lateral
    const availableWidth = Math.max(300, vRect.width - 150);

    const scaleH = availableHeight / orig.height;
    const scaleW = availableWidth / orig.width;
    const targetScale = Math.min(scaleH, scaleW);

    this.applyZoom(targetScale, 'Fit');
  }

  async fitToWidth() {
    if (this.totalPages === 0) return;
    this.currentFitMode = 'width';
    const orig = await this.pdfEngine.getPageOriginalSize(this.currentPage);
    const vRect = this.viewportEl.getBoundingClientRect();

    const availableWidth = Math.max(300, vRect.width - 40);
    const targetScale = availableWidth / orig.width;

    this.applyZoom(targetScale, 'Ancho');
  }

  private applyZoom(newScale: number, customLabel?: string) {
    if (!customLabel) {
      this.currentFitMode = 'free';
    }
    this.pdfEngine.setScale(newScale);
    const pct = Math.round(this.pdfEngine.getScale() * 100);
    this.toolbar.setZoomLabel(customLabel || `${pct}%`);

    for (let p = 1; p <= this.totalPages; p++) {
      const pageWrapper = document.getElementById(`page-${p}`);
      if (pageWrapper) {
        this.pdfEngine.renderPage(p, pageWrapper).then(() => {
          const annotLayer = pageWrapper.querySelector('.pdf-custom-annotation-layer') as HTMLElement;
          if (annotLayer) {
            this.annotationManager.renderAnnotationsForPage(p, annotLayer);
          }
          this.updateMagneticDock();
        });
      }
    }
  }

  private jumpToPage(page: number) {
    if (this.totalPages === 0) return;
    const clamped = Math.max(1, Math.min(this.totalPages, page));
    this.currentPage = clamped;
    this.toolbar.setPage(clamped, this.totalPages);
    this.toolbar.triggerZenActivity();
    const target = document.getElementById(`page-${clamped}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  private updateContainerPadding() {
    const firstWrapper = this.pagesContainer.querySelector('.pdf-page-wrapper') as HTMLElement;
    if (!firstWrapper) return;
    const vHeight = this.viewportEl.clientHeight;
    const pageHeight = firstWrapper.offsetHeight;
    if (pageHeight > 0 && pageHeight < vHeight) {
      const verticalMargin = Math.max(16, Math.round((vHeight - pageHeight) / 2));
      this.pagesContainer.style.paddingTop = `${verticalMargin}px`;
      this.pagesContainer.style.paddingBottom = `${verticalMargin}px`;
    } else {
      this.pagesContainer.style.paddingTop = '16px';
      this.pagesContainer.style.paddingBottom = '40px';
    }
  }

  private updateMagneticDock() {
    if (this.totalPages === 0) return;
    this.updateContainerPadding();

    const firstPage = this.pagesContainer.querySelector('.pdf-page-wrapper') as HTMLElement;
    if (!firstPage) return;

    const vRect = this.viewportEl.getBoundingClientRect();
    const dRect = firstPage.getBoundingClientRect();

    const metrics: MarginMetrics = {
      marginLeft: Math.max(0, dRect.left - vRect.left),
      marginRight: Math.max(0, vRect.right - dRect.right),
      marginTop: Math.max(0, dRect.top - vRect.top),
      marginBottom: Math.max(0, vRect.bottom - dRect.bottom),
      docWidth: dRect.width,
      docHeight: dRect.height,
      viewportWidth: vRect.width,
      viewportHeight: vRect.height,
      viewportTop: vRect.top,
    };

    const dockResult = calculateDocking(metrics);
    this.toolbar.setOrientation(dockResult.isVertical, dockResult.dock, dockResult.coords);
  }

  private setupDropzone() {
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.welcomeEl.classList.add('dragover');
    });

    window.addEventListener('dragleave', (e) => {
      if (e.relatedTarget === null) {
        this.welcomeEl.classList.remove('dragover');
      }
    });

    window.addEventListener('drop', async (e) => {
      e.preventDefault();
      this.welcomeEl.classList.remove('dragover');
      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          await this.loadFromFile(file);
        }
      }
    });

    this.welcomeEl.addEventListener('click', () => {
      this.fileInput.click();
    });

    document.getElementById('btn-sample-busqueda')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      await this.loadFromUrl('/samples/busqueda_binaria.pdf', 'Análisis de la Búsqueda Binaria Recursiva.pdf');
    });

    document.getElementById('btn-sample-tgr')?.addEventListener('click', async (e) => {
      e.stopPropagation();
      await this.loadFromUrl('/samples/tgr2.pdf', 'TGR2.pdf');
    });
  }

  private setupResizeAndScroll() {
    this.viewportEl.addEventListener('click', () => {
      if (document.activeElement instanceof HTMLInputElement) {
        document.activeElement.blur();
      }
    });

    window.addEventListener('resize', () => {
      if (this.currentFitMode === 'width') {
        this.fitToWidth();
      } else if (this.currentFitMode === 'page') {
        this.fitToPage();
      } else {
        this.updateMagneticDock();
      }
    });

    this.viewportEl.addEventListener('scroll', () => {
      this.toolbar.triggerZenActivity();

      // Detectar página visible en el centro vertical de la pantalla
      const wrappers = this.pagesContainer.querySelectorAll('.pdf-page-wrapper');
      const vCenter = this.viewportEl.scrollTop + (this.viewportEl.clientHeight / 2);
      for (const w of Array.from(wrappers)) {
        const el = w as HTMLElement;
        if (el.offsetTop <= vCenter && el.offsetTop + el.offsetHeight >= vCenter) {
          const p = parseInt(el.id.replace('page-', ''), 10);
          if (p !== this.currentPage && !isNaN(p)) {
            this.currentPage = p;
            this.toolbar.setPage(p, this.totalPages);
          }
          break;
        }
      }
    });
  }

  private setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Navegación de páginas con flechitas y teclas de presentación
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
        if (this.totalPages > 0 && this.currentPage < this.totalPages) {
          e.preventDefault();
          this.jumpToPage(this.currentPage + 1);
        }
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        if (this.totalPages > 0 && this.currentPage > 1) {
          e.preventDefault();
          this.jumpToPage(this.currentPage - 1);
        }
      }
      if (e.key === 'Home') {
        if (this.totalPages > 0 && this.currentPage !== 1) {
          e.preventDefault();
          this.jumpToPage(1);
        }
      }
      if (e.key === 'End') {
        if (this.totalPages > 0 && this.currentPage !== this.totalPages) {
          e.preventDefault();
          this.jumpToPage(this.totalPages);
        }
      }

      if (e.key === 'o' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.fileInput.click();
      }
      if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.panels.toggleSearch();
      }
      if (e.key === 'i' || e.key === 'I') {
        this.panels.toggleTOC();
      }
      if (e.key === 'Escape') {
        this.panels.closeAll();
      }
      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        this.toolbar.focusPageInput();
      }
      if (e.key === 'p' || e.key === 'P' || e.key === '0') {
        e.preventDefault();
        this.fitToPage();
      }
      if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        this.fitToWidth();
      }
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        this.applyZoom(this.pdfEngine.getScale() + 0.15);
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        this.applyZoom(this.pdfEngine.getScale() - 0.15);
      }
      if (e.key === 'z' || e.key === 'Z') {
        const btnZen = document.getElementById('btn-tool-zen');
        btnZen?.click();
      }
    });
  }
}

// Inicializar al cargar el DOM
window.addEventListener('DOMContentLoaded', () => {
  const app = new LectorPDFApp();
  // Exponer a ventana para depuración o automatización
  (window as unknown as { lectorApp: LectorPDFApp }).lectorApp = app;
});
