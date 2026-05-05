import { LitElement, html, css } from 'lit';

// Profile-driven LED state picker.
// pickerHint.kind = 'orthogonal': render a 2D grid (color × mode).
// pickerHint.kind = 'flat':       render a single row of swatches.
export class ColorPalette extends LitElement {
  static properties = {
    profile: { attribute: false },
    allowedStateIds: { attribute: false },
    selectedStateId: { type: String },
  };

  static styles = css`
    :host { display: block; }
    .flat { display: flex; flex-wrap: wrap; gap: 6px; }
    .orth { display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: start; }
    .colors { display: grid; grid-template-columns: repeat(8, 24px); gap: 4px; }
    .modes { display: grid; gap: 4px; }
    .swatch {
      width: 24px; height: 24px; border-radius: 4px;
      border: 1px solid rgba(255,255,255,0.1);
      cursor: pointer; padding: 0; background: var(--panel-2);
    }
    .swatch.selected { outline: 2px solid var(--accent); outline-offset: 1px; }
    .swatch.disabled { opacity: 0.25; cursor: not-allowed; }
    .mode-btn { padding: 4px 8px; font-size: 0.85rem; }
    .mode-btn.selected { outline: 2px solid var(--accent); }
    .row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    label { font-size: 0.85rem; color: var(--muted); }
  `;

  render() {
    const profile = this.profile;
    if (!profile) return null;
    const allowed = new Set(this.allowedStateIds ?? profile.states.map((s) => s.id));
    if (profile.pickerHint.kind === 'flat') return this._renderFlat(profile, allowed);
    return this._renderOrthogonal(profile, allowed);
  }

  _renderFlat(profile, allowed) {
    return html`
      <div class="flat">
        ${profile.states.map((s) => html`
          <button
            type="button"
            class=${`swatch ${s.id === this.selectedStateId ? 'selected' : ''} ${allowed.has(s.id) ? '' : 'disabled'}`}
            title=${s.label}
            ?disabled=${!allowed.has(s.id)}
            style=${`background:${s.hex}`}
            @click=${() => this._pick(s.id)}
          ></button>
        `)}
      </div>
    `;
  }

  _renderOrthogonal(profile, allowed) {
    // Use profile.palette × profile.modes if exposed (LP MK3 does this).
    const palette = profile.palette ?? [];
    const modes = profile.modes ?? [];
    const split = profile.pickerHint.split;
    const sel = this.selectedStateId ? split(profile.states.find((s) => s.id === this.selectedStateId)) : null;

    return html`
      <div class="orth">
        <div>
          <div class="row"><label>${profile.pickerHint.colorAxisLabel}</label></div>
          <div class="colors">
            ${palette.map((c) => {
              const id = `lp:${c.index}:${sel?.mode ?? 'static'}`;
              return html`
                <button
                  type="button"
                  class=${`swatch ${this.selectedStateId === id ? 'selected' : ''}`}
                  title=${`${c.index} ${c.name}`}
                  style=${`background:${c.hex}`}
                  @click=${() => this._pick(id)}
                ></button>
              `;
            })}
          </div>
        </div>
        <div>
          <div class="row"><label>${profile.pickerHint.modeAxisLabel}</label></div>
          <div class="modes">
            ${modes.map((m) => {
              const id = `lp:${sel?.color ?? 0}:${m.id}`;
              return html`
                <button
                  type="button"
                  class=${`mode-btn ${sel?.mode === m.id ? 'selected' : ''}`}
                  @click=${() => this._pick(id)}
                >${m.label}</button>
              `;
            })}
          </div>
        </div>
      </div>
    `;
  }

  _pick(stateId) {
    this.dispatchEvent(new CustomEvent('state-pick', { detail: { stateId }, bubbles: true, composed: true }));
  }
}

customElements.define('color-palette', ColorPalette);
