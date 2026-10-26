import { ReadingMode } from '../types';

export class ReadingModesManager {
  private currentMode: ReadingMode = 'light';

  constructor(private rootElement: HTMLElement = document.body) {}

  getMode(): ReadingMode {
    return this.currentMode;
  }

  setMode(mode: ReadingMode) {
    this.currentMode = mode;
    this.rootElement.dataset.readmode = mode;
  }
}
