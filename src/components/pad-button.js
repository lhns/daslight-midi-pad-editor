import { LitElement, html, css } from 'lit';
import { syncAnimations } from '../lib/anim-sync.js';

// A single launchpad button. Three horizontal stripes (top = Off, middle = On,
// bottom = Fade). The host element fills its grid cell; the visual button
// (.stripes) is centered inside and sized according to the layout entry's
// `shape`:
//   - 'rect'   — fills the cell (used for the wider clip-grid cells too).
//   - 'circle' — circle, fitted to min(cell-w, cell-h).
//   - 'square' — square (no border-radius), same fitting.
export class PadButton extends LitElement {
  static properties = {
    addr: { attribute: false },
    states: { attribute: false },   // {off, on, fade} each maps to LedState | null
    visibleControlStates: { attribute: false }, // ('off'|'on'|'fade')[]
    flashStrategy: { attribute: false }, // 'off-state' | 'black'
    shape: { type: String, reflect: true }, // 'rect' | 'circle' | 'square'
    selected: { type: Boolean, reflect: true },
    bound: { type: Boolean, reflect: true },
  };

  static styles = css`
    :host {
      position: relative;
      width: 100%;
      height: 100%;
      display: grid;
      place-items: center;
      cursor: pointer;
      box-sizing: border-box;
    }
    :host(:not([bound])) { opacity: 0.65; }
    :host([selected]) .stripes { outline: 2px solid var(--accent); outline-offset: 1px; }

    .stripes {
      width: 100%;
      height: 100%;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: #0b0b0e;
      overflow: hidden;
      box-sizing: border-box;
      display: grid;
      grid-template-rows: repeat(var(--stripe-count, 3), 1fr);
      position: relative;
    }

    /* Circle and square shapes fit to the smaller cell dimension. */
    :host([shape="circle"]) .stripes,
    :host([shape="square"]) .stripes {
      width: auto;
      height: 100%;
      aspect-ratio: 1;
      max-width: 100%;
    }
    :host([shape="circle"]) .stripes { border-radius: 50%; }

    .stripe { width: 100%; height: 100%; background: var(--stripe-color, transparent); }
    .stripe.flash { animation: flash 0.5s steps(2, end) infinite; }
    .stripe.pulse { animation: pulse 1.4s ease-in-out infinite; }
    @keyframes flash {
      0%, 49%   { background: var(--stripe-color); }
      50%, 100% { background: var(--alt-color); }
    }
    @keyframes pulse {
      0%, 100% { background: var(--stripe-color); }
      50%      { background: var(--alt-color); }
    }

    .unmapped {
      position: absolute;
      inset: 15%;
      pointer-events: none;
      z-index: 2;
      filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.85));
    }
  `;

  render() {
    const visible = this.visibleControlStates ?? ['off', 'on', 'fade'];
    const states = this.states ?? {};
    const strategy = this.flashStrategy ?? 'black';
    return html`
      <div
        class="stripes"
        role="button"
        aria-label=${`button ${this.addr?.id}`}
        style=${`--stripe-count:${visible.length}`}
      >
        ${visible.map((c) => stripe(c, states, strategy))}
        ${this.bound ? null : html`
          <svg class="unmapped" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="none" stroke="#ef4444" stroke-width="2.5"></circle>
            <line x1="5.5" y1="18.5" x2="18.5" y2="5.5" stroke="#ef4444" stroke-width="2.5"></line>
          </svg>
        `}
      </div>
    `;
  }

  updated() {
    syncAnimations(this.shadowRoot);
  }
}

// Resolve the "alternate" color for a flash/pulse animation on the given
// control state. The hardware can only animate one LED at a time:
//   - APC mini ('black' strategy): flash always toggles between color and 0.
//   - LP MK3 ('off-state' strategy): on/fade flash toggles between their
//     color and the static off-state color, but if Off itself animates the
//     LED falls back to color↔black for on/fade. The off stripe always
//     animates against black since there's no lower reference.
function altColor(ctrl, states, strategy) {
  if (strategy === 'black') return '#000';
  if (ctrl === 'off') return '#000';
  const off = states.off;
  if (!off) return '#000';
  if (off.animation !== 'static') return '#000';
  return off.hex;
}

function stripe(ctrl, states, strategy) {
  const state = states?.[ctrl];
  if (!state) return html`<div class="stripe"></div>`;
  const alt = altColor(ctrl, states, strategy);
  const cls = `stripe ${state.animation === 'flash' ? 'flash' : state.animation === 'pulse' ? 'pulse' : ''}`;
  return html`<div
    class=${cls}
    style=${`--stripe-color:${state.hex};--alt-color:${alt};background:${state.hex}`}
  ></div>`;
}

customElements.define('pad-button', PadButton);
