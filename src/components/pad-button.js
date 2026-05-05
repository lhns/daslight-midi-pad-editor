import { LitElement, html, css } from 'lit';
import { syncAnimations } from '../lib/anim-sync.js';

// A single launchpad button. Three horizontal stripes (top = Off, middle = On,
// bottom = Fade). Each stripe shows the LED's display color and animates
// based on the LED state's animation (static / flash / pulse).
export class PadButton extends LitElement {
  static properties = {
    addr: { attribute: false },
    states: { attribute: false },   // {off, on, fade} each maps to LedState | null
    selected: { type: Boolean, reflect: true },
    bound: { type: Boolean, reflect: true },
  };

  static styles = css`
    :host {
      display: block;
      width: var(--pad-size, 48px);
      height: var(--pad-size, 48px);
      border-radius: 6px;
      border: 1px solid var(--border);
      background: #0b0b0e;
      cursor: pointer;
      overflow: hidden;
      position: relative;
      box-sizing: border-box;
    }
    :host([bound="false"]) { opacity: 0.35; cursor: not-allowed; }
    :host([selected]) { outline: 2px solid var(--accent); outline-offset: 1px; }
    .stripes {
      display: grid;
      grid-template-rows: 1fr 1fr 1fr;
      width: 100%; height: 100%;
    }
    .stripe { width: 100%; height: 100%; }
    .stripe.flash { animation: flash 0.5s steps(2, end) infinite; }
    .stripe.pulse { animation: pulse 1.4s ease-in-out infinite; }
    @keyframes flash { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0.1; } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
    :host([data-round]) { border-radius: 50%; }
  `;

  render() {
    const { off, on, fade } = this.states ?? {};
    return html`
      <div class="stripes" role="button" aria-label=${`button ${this.addr?.id}`}>
        ${stripe(off)}
        ${stripe(on)}
        ${stripe(fade)}
      </div>
    `;
  }

  updated() {
    if (this.addr?.kind === 'round') this.dataset.round = '';
    syncAnimations(this.shadowRoot);
  }
}

function stripe(state) {
  if (!state) return html`<div class="stripe"></div>`;
  const cls = `stripe ${state.animation === 'flash' ? 'flash' : state.animation === 'pulse' ? 'pulse' : ''}`;
  return html`<div class=${cls} style=${`background:${state.hex}`}></div>`;
}

customElements.define('pad-button', PadButton);
