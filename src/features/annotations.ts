import { HighlightAnnotation, HighlightColor, MarginNote, NormalizedRect } from '../types';

export class AnnotationManager {
  private highlights: HighlightAnnotation[] = [];
  private notes: MarginNote[] = [];
  private storageKey = 'lector_pdf_annotations_default';

  constructor(documentId = 'default') {
    this.setDocumentId(documentId);
  }

  setDocumentId(id: string) {
    this.storageKey = `lector_pdf_annotations_${id}`;
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.highlights = parsed.highlights || [];
        this.notes = parsed.notes || [];
      } else {
        this.highlights = [];
        this.notes = [];
      }
    } catch {
      this.highlights = [];
      this.notes = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify({
          highlights: this.highlights,
          notes: this.notes,
        })
      );
    } catch {
      // Manejar cuota de almacenamiento
    }
  }

  addHighlight(
    pageNumber: number,
    color: HighlightColor,
    text: string,
    rects: NormalizedRect[]
  ): HighlightAnnotation {
    const hl: HighlightAnnotation = {
      id: `hl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      pageNumber,
      color,
      text,
      rects,
      createdAt: Date.now(),
    };
    this.highlights.push(hl);
    this.saveToStorage();
    return hl;
  }

  deleteHighlight(id: string) {
    this.highlights = this.highlights.filter(h => h.id !== id);
    this.saveToStorage();
  }

  addNote(
    pageNumber: number,
    x: number,
    y: number,
    text: string,
    color: HighlightColor = 'purple'
  ): MarginNote {
    const note: MarginNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      pageNumber,
      x,
      y,
      text,
      color,
      createdAt: Date.now(),
    };
    this.notes.push(note);
    this.saveToStorage();
    return note;
  }

  deleteNote(id: string) {
    this.notes = this.notes.filter(n => n.id !== id);
    this.saveToStorage();
  }

  renderAnnotationsForPage(pageNumber: number, container: HTMLElement) {
    container.innerHTML = '';

    // Renderizar resaltados
    const pageHighlights = this.highlights.filter(h => h.pageNumber === pageNumber);
    for (const hl of pageHighlights) {
      for (const r of hl.rects) {
        const mark = document.createElement('div');
        mark.className = `pdf-highlight-rect color-${hl.color}`;
        mark.style.top = `${r.top * 100}%`;
        mark.style.left = `${r.left * 100}%`;
        mark.style.width = `${r.width * 100}%`;
        mark.style.height = `${r.height * 100}%`;
        mark.title = `Resaltado (${hl.color}): "${hl.text}"`;
        container.appendChild(mark);
      }
    }

    // Renderizar notas al margen
    const pageNotes = this.notes.filter(n => n.pageNumber === pageNumber);
    for (const note of pageNotes) {
      const pin = document.createElement('div');
      pin.className = `pdf-margin-note-pin color-${note.color}`;
      pin.style.top = `${note.y * 100}%`;
      pin.style.left = `${note.x * 100}%`;
      pin.innerHTML = `
        <svg viewBox="0 0 24 24" class="note-pin-icon">
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
      `;

      // Popover al hacer hover o clic
      const popover = document.createElement('div');
      popover.className = 'pdf-note-popover';
      popover.innerHTML = `
        <div class="note-popover-text">${this.escapeHTML(note.text)}</div>
        <button class="note-del-btn" title="Eliminar nota">✕</button>
      `;

      const delBtn = popover.querySelector('.note-del-btn');
      delBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteNote(note.id);
        pin.remove();
      });

      pin.appendChild(popover);
      container.appendChild(pin);
    }
  }

  private escapeHTML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
