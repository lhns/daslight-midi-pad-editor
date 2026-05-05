import { LitElement, html, css } from 'lit';
import { store } from './state/store.js';
import { installGlobalSync } from './lib/anim-sync.js';
import { copyVisible, pasteVisible } from './state/actions.js';
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
      height: 100dvh;
      min-height: 0;
      overflow: hidden;
    }
    main {
      display: grid;
      grid-template-columns: 1fr auto;
      min-height: 0;
      height: 100%;
      overflow: hidden;
    }
    @media (max-width: 700px) {
      :host {
        height: auto;
        min-height: 100dvh;
        overflow: visible;
      }
      main {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto;
        overflow: visible;
        height: auto;
      }
    }
    .pad-area {
      display: grid;
      place-items: center;
      padding: clamp(0.5rem, 2vw, 1.5rem);
      overflow: auto;
      min-width: 0;
      min-height: 0;
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
    this._onKey = (e) => handleKeyShortcut(e);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('keydown', this._onKey);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this._onKey);
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

function handleKeyShortcut(e) {
  if (!(e.ctrlKey || e.metaKey)) return;
  // Skip if the user is typing in a form control.
  const t = document.activeElement;
  if (t?.isContentEditable) return;
  const tag = t?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  const key = e.key?.toLowerCase();
  if (key === 'c') {
    copyVisible();
    e.preventDefault();
  } else if (key === 'v') {
    pasteVisible();
    e.preventDefault();
  }
}
