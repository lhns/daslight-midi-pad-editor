import { LitElement, html, css } from 'lit';
import { buttonStyles } from '../styles/buttons.js';

// Profile-driven LED state picker. Renders the profile's colorAxis as a row
// of swatches with the modeAxis below. Disabled state for swatches whose id
// isn't in `allowedColorIds`.
//
// Picks are emitted per-axis (`color-pick` / `mode-pick`) so the consuming
// settings panel can edit one axis at a time across a mixed selection
// without forcing the other axis to a fallback value.
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
        margin-bottom: 8px;
        max-width: calc(var(--swatch-cols) * var(--swatch-size) + (var(--swatch-cols) - 1) * var(--swatch-gap));
        justify-content: start;
      }
      .modes { display: flex; gap: 4px; flex-wrap: wrap; }
      /* Swatches are color samples, not generic buttons — keep them locally
         styled so the shared button rule doesn't swap their fill. */
      .swatch {
        width: var(--swatch-size);
        height: var(--swatch-size);
        min-width: 0;
        border-radius: 4px;
        border: 1px solid rgba(255,255,255,0.1);
        cursor: pointer;
        padding: 0;
        background: var(--panel-2);
        font-size: 0; /* override shared button font-size; cells are square */
        line-height: 0;
      }
      .swatch.selected { outline: 2px solid var(--accent); outline-offset: 1px; }
      .swatch.disabled { opacity: 0.18; cursor: not-allowed; }
      .axis-label { font-size: 0.75rem; color: var(--muted); margin: 4px 0; }
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
      ${profile.modeAxis.length > 1 ? html`
        <div class="axis-label">Mode</div>
        <div class="modes">
          ${profile.modeAxis.map((m) => html`
            <button
              type="button"
              class=${sel?.modeId === m.id ? 'selected' : ''}
              @click=${() => this._pickMode(m.id)}
            >${m.label}</button>
          `)}
        </div>
      ` : null}
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
  _pickMode(modeId) {
    this.dispatchEvent(new CustomEvent('mode-pick', { detail: { modeId }, bubbles: true, composed: true }));
  }
}

customElements.define('color-palette', ColorPalette);
