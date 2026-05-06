import { LitElement, html, css } from 'lit';
import { buttonStyles } from '../styles/buttons.js';

// Color picker for the active device profile. Renders the colorAxis as a
// fixed-size swatch grid (max 8 columns). Mode selection is rendered by the
// settings panel itself, alongside Copy/Paste, in a sibling side column —
// this component only emits `color-pick`.
export class ColorPalette extends LitElement {
  static properties = {
    profile: { attribute: false },
    allowedColorIds: { attribute: false },
    selectedStateId: { type: String },
  };

  static styles = [
    buttonStyles,
    css`
      :host {
        display: block;
        --swatch-size: 26px;
        --swatch-gap: 4px;
        --swatch-cols: 8;
      }
      .colors {
        display: grid;
        grid-template-columns: repeat(auto-fill, var(--swatch-size));
        gap: var(--swatch-gap);
        max-width: calc(var(--swatch-cols) * var(--swatch-size) + (var(--swatch-cols) - 1) * var(--swatch-gap));
        justify-content: start;
      }
      .swatch {
        width: var(--swatch-size);
        height: var(--swatch-size);
        min-width: 0;
        border-radius: 4px;
        border: 1px solid rgba(255,255,255,0.1);
        cursor: pointer;
        padding: 0;
        background: var(--panel-2);
        font-size: 0;
        line-height: 0;
      }
      .swatch.selected { outline: 2px solid var(--accent); outline-offset: 1px; }
      .swatch.disabled { opacity: 0.18; cursor: not-allowed; }
      .axis-label { font-size: 0.75rem; color: var(--muted); margin: 0 0 4px; }
    `,
  ];

  render() {
    const profile = this.profile;
    if (!profile) return null;
    const allowedColors = new Set(this.allowedColorIds ?? profile.colorAxis.map((c) => c.id));
    const sel = this._currentAxes();

    return html`
      <div class="axis-label">Color</div>
      <div class="colors">
        ${profile.colorAxis.map((c) => html`
          <button
            type="button"
            class=${`swatch ${sel?.colorId === c.id ? 'selected' : ''} ${allowedColors.has(c.id) ? '' : 'disabled'}`}
            title=${c.label}
            ?disabled=${!allowedColors.has(c.id)}
            style=${`background:${c.hex}`}
            @click=${() => this._pickColor(c.id)}
          ></button>
        `)}
      </div>
    `;
  }

  _currentAxes() {
    if (!this.selectedStateId) return null;
    try { return this.profile.decompose(this.selectedStateId); }
    catch { return null; }
  }

  _pickColor(colorId) {
    this.dispatchEvent(new CustomEvent('color-pick', { detail: { colorId }, bubbles: true, composed: true }));
  }
}

customElements.define('color-palette', ColorPalette);
