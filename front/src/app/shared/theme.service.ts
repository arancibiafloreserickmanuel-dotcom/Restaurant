import { Injectable, signal } from '@angular/core';

export type ThemeId = 'crema' | 'oryzo' | 'claro' | 'negro';

export const THEMES: readonly { id: ThemeId; label: string; description: string; swatch: [string, string, string] }[] = [
  { id: 'crema', label: 'Crema', description: 'Crema y blanco con detalles terracota (por defecto)', swatch: ['#fbf3ea', '#ffffff', '#a4501f'] },
  { id: 'oryzo', label: 'Oryzo', description: 'Oscuro: plomo, café y crema', swatch: ['#100904', '#382416', '#ffedd7'] },
  { id: 'claro', label: 'Blanco', description: 'Fondo blanco, texto negro', swatch: ['#ffffff', '#f4f4f2', '#111111'] },
  { id: 'negro', label: 'Negro', description: 'Negro puro, texto blanco', swatch: ['#000000', '#1a1a1a', '#ffffff'] },
];

const STORAGE_KEY = 'pos_theme';
const DEFAULT_THEME: ThemeId = 'crema';

/** Applies the selected theme to <html data-theme>. The early script in index.html avoids a flash on load. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<ThemeId>(DEFAULT_THEME);

  constructor() {
    this.apply(this.readStored() ?? DEFAULT_THEME);
  }

  setTheme(id: ThemeId): void {
    this.apply(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* storage unavailable: theme still applies for this session */
    }
  }

  private apply(id: ThemeId): void {
    this.theme.set(id);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', id);
    }
  }

  private readStored(): ThemeId | null {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return THEMES.some((t) => t.id === v) ? (v as ThemeId) : null;
    } catch {
      return null;
    }
  }
}
