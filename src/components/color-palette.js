import { LitElement, html, css } from 'lit';

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

  static styles = css`
    :host { display: block; }
    .colors {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 4px;
      margin-bottom: 8px;
    }
    .modes { display: flex; gap: 4px; flex-wrap: wrap; }
    .swatch {
      aspect-ratio: 1;
      min-width: 22px;
      border-radius: 4px;
      border: 1px solid rgba(255,255,255,0.1);
      cursor: pointer; padding: 0; background: var(--panel-2);
    }
    .swatch.selected { outline: 2px solid var(--accent); outline-offset: 1px; }
    .swatch.disabled { opacity: 0.18; cursor: not-allowed; }
    .mode-btn {
      padding: 4px 10px; font-size: 0.85rem;
      background: var(--panel-2); border: 1px solid var(--border);
      border-radius: var(--radius); cursor: pointer; color: inherit;
    }
    .mode-btn.selected { outline: 2px solid var(--accent); }
    .axis-label { font-size: 0.75rem; color: var(--muted); margin: 4px 0; }
  `;

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
              class=${`mode-btn ${sel?.modeId === m.id ? 'selected' : ''}`}
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
