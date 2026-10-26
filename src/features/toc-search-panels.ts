import { HighlightColor, SearchMatch, TOCItem } from '../types';

export class TOCSearchPanels {
  private tocPanel: HTMLElement;
  private searchPanel: HTMLElement;
  private selectionBubble: HTMLElement;

  constructor(
    private container: HTMLElement,
    private onPageJump: (page: number) => void,
    private onHighlightSelection: (color: HighlightColor) => void,
    private onAddNoteSelection: () => void
  ) {
    this.tocPanel = this.createTOCPanel();
    this.searchPanel = this.createSearchPanel();
    this.selectionBubble = this.createSelectionBubble();

    this.container.appendChild(this.tocPanel);
    this.container.appendChild(this.searchPanel);
    this.container.appendChild(this.selectionBubble);

    this.setupGlobalSelection();
  }

  toggleTOC(force?: boolean) {
    const isOpen = this.tocPanel.classList.contains('open');
    const target = force !== undefined ? force : !isOpen;
    this.closeAll();
    if (target) this.tocPanel.classList.add('open');
  }

  toggleSearch(force?: boolean) {
    const isOpen = this.searchPanel.classList.contains('open');
    const target = force !== undefined ? force : !isOpen;
    this.closeAll();
    if (target) {
      this.searchPanel.classList.add('open');
      const input = this.searchPanel.querySelector('input');
      input?.focus();
    }
  }

  closeAll() {
    this.tocPanel.classList.remove('open');
    this.searchPanel.classList.remove('open');
    this.selectionBubble.classList.remove('visible');
  }

  setTOC(items: TOCItem[]) {
    const list = this.tocPanel.querySelector('.panel-list');
    if (!list) return;
    list.innerHTML = '';

    if (items.length === 0) {
      list.innerHTML = `<div class="empty-list-msg">Este documento no incluye índice de capítulos.</div>`;
      return;
    }

    const renderTree = (itemList: TOCItem[], depth = 0) => {
      for (const item of itemList) {
        const div = document.createElement('div');
        div.className = 'toc-list-item';
        div.style.paddingLeft = `${12 + depth * 14}px`;
        div.innerHTML = `
          <span class="toc-item-title">${this.escapeHTML(item.title)}</span>
          <span class="toc-item-page">pág. ${item.pageNumber}</span>
        `;
        div.addEventListener('click', () => {
          this.onPageJump(item.pageNumber);
          this.toggleTOC(false);
        });
        list.appendChild(div);

        if (item.children && item.children.length > 0) {
          renderTree(item.children, depth + 1);
        }
      }
    };

    renderTree(items);
  }

  setSearchResults(matches: SearchMatch[], currentQuery: string) {
    const countEl = this.searchPanel.querySelector('.search-matches-count');
    const list = this.searchPanel.querySelector('.search-results-list');
    if (!countEl || !list) return;

    countEl.textContent = `${matches.length} coincidencias para "${currentQuery}"`;
    list.innerHTML = '';

    if (matches.length === 0) {
      list.innerHTML = `<div class="empty-list-msg">No se encontraron resultados.</div>`;
      return;
    }

    matches.slice(0, 30).forEach((m) => {
      const card = document.createElement('div');
      card.className = 'search-match-card';
      card.innerHTML = `
        <div class="search-match-header">
          <span class="search-match-page">Pág. ${m.pageNumber}</span>
        </div>
        <div class="search-match-snippet">${this.highlightSnippet(m.snippet, currentQuery)}</div>
      `;
      card.addEventListener('click', () => {
        this.onPageJump(m.pageNumber);
      });
      list.appendChild(card);
    });
  }

  onSearchInput(callback: (query: string) => void) {
    const input = this.searchPanel.querySelector('input');
    input?.addEventListener('input', () => {
      callback(input.value);
    });
  }

  private createTOCPanel(): HTMLElement {
    const panel = document.createElement('aside');
    panel.id = 'panel-toc';
    panel.className = 'slide-panel';
    panel.innerHTML = `
      <div class="panel-header">
        <span class="panel-title">
          <svg class="tool-icon" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h12"/></svg>
          Índice del Documento
        </span>
        <button class="panel-close-btn" title="Cerrar">✕</button>
      </div>
      <div class="panel-list"></div>
    `;
    panel.querySelector('.panel-close-btn')?.addEventListener('click', () => this.toggleTOC(false));
    return panel;
  }

  private createSearchPanel(): HTMLElement {
    const panel = document.createElement('aside');
    panel.id = 'panel-search';
    panel.className = 'slide-panel';
    panel.innerHTML = `
      <div class="panel-header">
        <span class="panel-title">
          <svg class="tool-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          Buscar en el texto
        </span>
        <button class="panel-close-btn" title="Cerrar">✕</button>
      </div>
      <div class="search-input-box">
        <svg class="tool-icon" style="color:var(--tx3)" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input type="text" placeholder="Escribe para buscar..." />
      </div>
      <div class="search-matches-count">0 coincidencias</div>
      <div class="search-results-list"></div>
    `;
    panel.querySelector('.panel-close-btn')?.addEventListener('click', () => this.toggleSearch(false));
    return panel;
  }

  private createSelectionBubble(): HTMLElement {
    const bubble = document.createElement('div');
    bubble.id = 'selection-bubble';
    bubble.innerHTML = `
      <button class="bubble-btn" data-color="yellow" title="Subrayar amarillo">
        <div class="color-dot c-yellow"></div>
      </button>
      <button class="bubble-btn" data-color="cyan" title="Subrayar azul">
        <div class="color-dot c-cyan"></div>
      </button>
      <button class="bubble-btn" data-color="purple" title="Subrayar morado">
        <div class="color-dot c-purple"></div>
      </button>
      <button class="bubble-btn" data-color="green" title="Subrayar verde">
        <div class="color-dot c-green"></div>
      </button>
      <div class="bubble-sep"></div>
      <button class="bubble-btn" id="bubble-add-note" title="Añadir nota">
        <svg class="tool-icon" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
      </button>
    `;

    bubble.querySelectorAll('.bubble-btn[data-color]').forEach(b => {
      b.addEventListener('click', () => {
        const color = (b as HTMLElement).dataset.color as HighlightColor;
        this.onHighlightSelection(color);
        bubble.classList.remove('visible');
      });
    });

    bubble.querySelector('#bubble-add-note')?.addEventListener('click', () => {
      this.onAddNoteSelection();
      bubble.classList.remove('visible');
    });

    return bubble;
  }

  private setupGlobalSelection() {
    document.addEventListener('selectionchange', () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        this.selectionBubble.classList.remove('visible');
        return;
      }

      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const vRect = this.container.getBoundingClientRect();

      if (rect.top >= vRect.top && rect.bottom <= vRect.bottom && rect.width > 0) {
        this.selectionBubble.style.left = `${rect.left + rect.width / 2}px`;
        this.selectionBubble.style.top = `${rect.top - 12}px`;
        this.selectionBubble.classList.add('visible');
      }
    });
  }

  private highlightSnippet(snippet: string, query: string): string {
    const escaped = this.escapeHTML(snippet);
    const qEsc = this.escapeHTML(query);
    const regex = new RegExp(`(${qEsc})`, 'gi');
    return escaped.replace(regex, '<mark class="snippet-hl">$1</mark>');
  }

  private escapeHTML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
