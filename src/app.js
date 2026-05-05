import { LitElement, html, css } from 'lit';
import { store } from './state/store.js';
import { installGlobalSync } from './lib/anim-sync.js';
import './components/drop-zone.js';
import './components/toolbar.js';
import './components/launchpad-grid.js';
import './components/settings-panel.js';

export class AppRoot extends LitElement {
  static properties = {
    _state: { state: true },
  };

  static styles = css`
    :host {
      display: grid;
      grid-template-rows: auto 1fr;
      min-height: 100vh;
    }
    main {
      display: grid;
      grid-template-columns: 1fr auto;
      min-height: 0;
    }
    @media (max-width: 700px) {
      :host { min-height: 100dvh; }
      main {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto;
      }
    }
    .pad-area {
      display: grid;
      place-items: center;
      padding: clamp(0.5rem, 2vw, 1.5rem);
      overflow: auto;
    }
    .empty {
      display: grid;
      place-items: center;
      padding: 2rem;
    }
  `;

  constructor() {
    super();
    this._state = store.getState();
    this._unsub = store.subscribe((s) => { this._state = s; });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unsub?.();
  }

  render() {
    const { document: doc, profile, fileName } = this._state;
    if (!doc || !profile) {
      return html`
        <div class="empty">
          <drop-zone></drop-zone>
        </div>
      `;
    }
    return html`
      <app-toolbar .fileName=${fileName}></app-toolbar>
      <main>
        <div class="pad-area">
          <launchpad-grid></launchpad-grid>
        </div>
        <settings-panel></settings-panel>
      </main>
    `;
  }
}

customElements.define('app-root', AppRoot);

installGlobalSync();
