import { Component, inject } from '@angular/core';
import { THEMES, ThemeId, ThemeService } from '../shared/theme.service';

/** Colour theme picker (Oryzo / Blanco / Negro). The choice is stored per device. */
@Component({
  selector: 'app-appearance-settings',
  standalone: true,
  template: `
    <div class="form-group appearance">
      <label id="theme-label">Apariencia</label>
      <div class="theme-options" role="radiogroup" aria-labelledby="theme-label">
        @for (t of themes; track t.id) {
          <button
            type="button"
            role="radio"
            class="theme-option"
            [class.selected]="theme.theme() === t.id"
            [attr.aria-checked]="theme.theme() === t.id"
            (click)="select(t.id)"
          >
            <span class="swatch" aria-hidden="true">
              <i [style.background]="t.swatch[0]"></i>
              <i [style.background]="t.swatch[1]"></i>
              <i [style.background]="t.swatch[2]"></i>
            </span>
            <span class="name">{{ t.label }}</span>
            <span class="desc">{{ t.description }}</span>
          </button>
        }
      </div>
      <small class="field-hint">El tema se guarda en este dispositivo.</small>
    </div>
  `,
  styles: [
    `
      .theme-options {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: var(--space-3);
        margin-top: var(--space-2);
      }
      .theme-option {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-2);
        padding: var(--space-4);
        background: transparent;
        color: var(--color-text);
        border: 1px dashed var(--color-border);
        border-radius: var(--radius-md);
        text-align: left;
        transition: border-color var(--duration-fast, 120ms) ease;
      }
      .theme-option:hover {
        border-color: var(--color-text-muted);
      }
      .theme-option.selected {
        border: 1px solid var(--color-text);
      }
      .swatch {
        display: flex;
        width: 100%;
        height: 28px;
        border: 1px solid var(--color-border);
        overflow: hidden;
      }
      .swatch i {
        flex: 1;
      }
      .name {
        font-weight: 500;
      }
      .desc {
        font-size: 0.8rem;
        color: var(--color-text-muted);
        text-transform: none;
        font-weight: 400;
      }
    `,
  ],
})
export class AppearanceSettingsComponent {
  protected readonly theme = inject(ThemeService);
  protected readonly themes = THEMES;

  protected select(id: ThemeId): void {
    this.theme.setTheme(id);
  }
}
