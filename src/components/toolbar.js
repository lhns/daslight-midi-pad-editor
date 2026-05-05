import { LitElement, html, css } from 'lit';
import { store } from '../state/store.js';
import { downloadCurrent, fixDeviceOut, reset, loadFile } from '../state/actions.js';
import { buttonStyles } from '../styles/buttons.js';

export class Toolbar extends LitElement {
  static properties = {
    fileName: { type: String },
    _state: { state: true },
  };

  static styles = [
    buttonStyles,
    css`
      :host { display: block; }
      .bar {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.6rem 1rem;
        background: var(--panel);
        border-bottom: 1px solid var(--border);
      }
      .filename { color: var(--muted); margin-left: auto; }
      .device { color: var(--muted); font-size: 0.85rem; }
      .banner {
        display: flex; align-items: center; gap: 0.75rem;
        padding: 0.6rem 1rem;
        background: rgba(217, 119, 6, 0.15);
        color: var(--warn);
        border-bottom: 1px solid var(--border);
      }
    `,
  ];

  constructor() {
    super();
    this._state = store.getState();
    this._unsub = store.subscribe((s) => { this._state = s; });
  }
  disconnectedCallback() { super.disconnectedCallback(); this._unsub?.(); }

  render() {
    const v = this._state.validation;
    const showBanner = v && !v.ok && v.offenders.some((o) => o.fixable);
    return html`
      <div class="bar">
        <button @click=${() => reset()}>Open another…</button>
        <button class="primary" @click=${() => downloadCurrent()}>Download XML</button>
        <span class="device">${this._state.profile?.label ?? ''}</span>
        <span class="filename">${this.fileName ?? ''}</span>
      </div>
      ${showBanner ? html`
        <div class="banner">
          <span>${v.offenders.length} entries have DEVICEOUT="All" instead of "${this._state.profile.deviceOut}".</span>
          <button @click=${() => fixDeviceOut()}>Fix all</button>
        </div>
      ` : null}
    `;
  }
}

customElements.define('app-toolbar', Toolbar);
