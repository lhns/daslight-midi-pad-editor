import { LitElement, html, css } from 'lit';
import { store } from '../state/store.js';
import { downloadCurrent, fixDeviceOut, loadFile, switchActiveProfile } from '../state/actions.js';
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
      .device-tabs { display: flex; gap: 6px; }
      input[type=file] { display: none; }
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
    const fixable = v?.offenders.filter((o) => o.fixable) ?? [];
    const showBanner = fixable.length > 0;
    const detected = this._state.detectedProfiles ?? [];
    const hasDoc = !!this._state.document;
    return html`
      <div class="bar">
        <input type="file" accept=".xml,application/xml,text/xml" @change=${this._onPick} />
        <button @click=${() => this._openPicker()}>Open file</button>
        <button class="primary" ?disabled=${!hasDoc} @click=${() => downloadCurrent()}>Download XML</button>
        ${detected.length > 1 ? html`
          <div class="device-tabs" role="tablist">
            ${detected.map((p) => html`
              <button
                class="pill"
                role="tab"
                aria-pressed=${p.id === this._state.profile?.id ? 'true' : 'false'}
                @click=${() => switchActiveProfile(p.id)}
              >${p.label}</button>
            `)}
          </div>
        ` : (hasDoc ? html`<span class="device">${this._state.profile?.label ?? ''}</span>` : null)}
        <span class="filename">${hasDoc ? (this.fileName ?? '') : ''}</span>
      </div>
      ${showBanner ? html`
        <div class="banner">
          <span>${fixable.length} entries have a non-canonical DEVICEOUT. "Fix all" sets each row's DEVICEOUT to match its input device.</span>
          <button @click=${() => fixDeviceOut()}>Fix all</button>
        </div>
      ` : null}
    `;
  }

  _openPicker() {
    this.renderRoot.querySelector('input[type=file]').click();
  }
  async _onPick(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    try { await loadFile(f); } catch { /* error already on state */ }
    e.target.value = ''; // allow re-picking the same file
  }
}

customElements.define('app-toolbar', Toolbar);
