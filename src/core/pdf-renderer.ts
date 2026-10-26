import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { TOCItem, SearchMatch } from '../types';

// Configurar el worker de PDF.js para Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export class PDFViewerEngine {
  private doc: pdfjsLib.PDFDocumentProxy | null = null;
  private currentScale = 1.25;
  private renderingQueue: Map<number, boolean> = new Map();

  async load(source: string | ArrayBuffer | Uint8Array): Promise<{ numPages: number; title: string }> {
    const loadingTask = pdfjsLib.getDocument(
      typeof source === 'string' ? { url: source } : { data: source }
    );
    this.doc = await loadingTask.promise;
    
    let title = 'Documento PDF';
    try {
      const meta = await this.doc.getMetadata();
      const info = meta.info as Record<string, unknown> | null;
      if (info && typeof info.Title === 'string' && info.Title.trim()) {
        title = info.Title.trim();
      }
    } catch {
      // Ignorar fallo de metadatos
    }

    return {
      numPages: this.doc.numPages,
      title,
    };
  }

  getNumPages(): number {
    return this.doc ? this.doc.numPages : 0;
  }

  getScale(): number {
    return this.currentScale;
  }

  setScale(scale: number) {
    this.currentScale = Math.max(0.4, Math.min(3.5, scale));
  }

  async getPageOriginalSize(pageNumber = 1): Promise<{ width: number; height: number }> {
    if (!this.doc) return { width: 595, height: 842 };
    try {
      const page = await this.doc.getPage(pageNumber);
      const vp = page.getViewport({ scale: 1.0 });
      return { width: vp.width, height: vp.height };
    } catch {
      return { width: 595, height: 842 };
    }
  }

  async renderPage(pageNumber: number, pageWrapper: HTMLElement): Promise<void> {
    if (!this.doc) return;
    if (this.renderingQueue.get(pageNumber)) return;

    this.renderingQueue.set(pageNumber, true);

    try {
      const page = await this.doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: this.currentScale });

      // Limpiar contenedor
      pageWrapper.innerHTML = '';
      pageWrapper.style.width = `${viewport.width}px`;
      pageWrapper.style.height = `${viewport.height}px`;
      pageWrapper.dataset.pageNumber = String(pageNumber);

      // 1. Canvas para gráficos vectoriales / imágenes del PDF
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      ctx.scale(dpr, dpr);

      pageWrapper.appendChild(canvas);

      // Renderizar PDF sobre el Canvas
      const renderContext = {
        canvasContext: ctx,
        viewport,
        canvas,
      };
      await page.render(renderContext).promise;

      // 2. Capa de Texto Seleccionable (TextLayer)
      const textLayerDiv = document.createElement('div');
      textLayerDiv.className = 'textLayer';
      textLayerDiv.style.width = `${viewport.width}px`;
      textLayerDiv.style.height = `${viewport.height}px`;
      pageWrapper.appendChild(textLayerDiv);

      const textContent = await page.getTextContent();
      const textLayer = new pdfjsLib.TextLayer({
        textContentSource: textContent,
        container: textLayerDiv,
        viewport,
      });
      await textLayer.render();

      // 3. Capa de Anotaciones y Resaltados (Overlay)
      const annotationLayer = document.createElement('div');
      annotationLayer.className = 'pdf-custom-annotation-layer';
      pageWrapper.appendChild(annotationLayer);

    } finally {
      this.renderingQueue.set(pageNumber, false);
    }
  }

  async extractTOC(): Promise<TOCItem[]> {
    if (!this.doc) return [];
    try {
      const outline = await this.doc.getOutline();
      if (!outline) return [];

      const convertItems = async (items: unknown[]): Promise<TOCItem[]> => {
        const result: TOCItem[] = [];
        for (const it of items) {
          const item = it as { title: string; dest?: unknown; items?: unknown[] };
          let pageNum = 1;
          if (item.dest) {
            try {
              let explicitDest: unknown = item.dest;
              if (typeof explicitDest === 'string') {
                const fetched = await this.doc!.getDestination(explicitDest);
                if (fetched) explicitDest = fetched;
              }
              if (Array.isArray(explicitDest) && explicitDest[0]) {
                const pageIndex = await this.doc!.getPageIndex(explicitDest[0]);
                pageNum = pageIndex + 1;
              }
            } catch {
              pageNum = 1;
            }
          }

          const children = item.items && item.items.length > 0 ? await convertItems(item.items) : undefined;
          result.push({
            title: item.title,
            pageNumber: pageNum,
            children,
          });
        }
        return result;
      };

      return await convertItems(outline);
    } catch {
      return [];
    }
  }

  async search(query: string): Promise<SearchMatch[]> {
    if (!this.doc || !query.trim()) return [];
    const results: SearchMatch[] = [];
    const q = query.trim().toLowerCase();

    for (let p = 1; p <= this.doc.numPages; p++) {
      const page = await this.doc.getPage(p);
      const textContent = await page.getTextContent();
      const fullText = textContent.items
        .map(item => ('str' in item ? item.str : ''))
        .join(' ');

      let matchIndex = 0;
      let pos = fullText.toLowerCase().indexOf(q);

      while (pos !== -1) {
        const start = Math.max(0, pos - 25);
        const end = Math.min(fullText.length, pos + q.length + 25);
        const snippet = fullText.substring(start, end).replace(/\s+/g, ' ');

        results.push({
          pageNumber: p,
          matchIndex,
          snippet: `...${snippet}...`,
        });

        matchIndex++;
        pos = fullText.toLowerCase().indexOf(q, pos + q.length);
        if (results.length > 60) break; // Límite de seguridad
      }
      if (results.length > 60) break;
    }

    return results;
  }
}
