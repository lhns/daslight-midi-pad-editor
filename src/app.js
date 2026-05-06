import { LitElement, html, css } from 'lit';
import { store } from './state/store.js';
import { installGlobalSync } from './lib/anim-sync.js';
import { copyVisible, pasteVisible, loadFile } from './state/actions.js';
import './components/toolbar.js';
import './components/launchpad-grid.js';
import './components/settings-panel.js';

export class AppRoot extends LitElement {
  static properties = {
    _state: { state: true },
    _dragging: { state: true },
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
    main.solo { grid-template-columns: 1fr; }
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
      position: relative;
    }
    .placeholder {
      color: var(--muted);
      font-size: 1rem;
      text-align: center;
      padding: 3rem 2rem;
      border: 2px dashed var(--border);
      border-radius: 12px;
      background: var(--panel);
      width: min(720px, 90vw);
      box-sizing: border-box;
      transition: border-color 0.15s, background 0.15s;
    }
    .pad-area.dragging .placeholder,
    .pad-area.dragging launchpad-grid {
      outline: 2px dashed var(--accent);
      outline-offset: 4px;
      border-radius: 12px;
    }
    .placeholder .error {
      color: var(--danger);
      margin-top: 1rem;
      white-space: pre-wrap;
      font-size: 0.85rem;
    }
  `;

  constructor() {
    super();
    this._state = store.getState();
    this._unsub = store.subscribe((s) => { this._state = s; });
    this._onKey = (e) => handleKeyShortcut(e);
    this._dragging = false;
    this._dragDepth = 0; // dragenter/leave nest within children; counter cancels
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
    const { document: doc, profile, fileName, loadError } = this._state;
    const hasDoc = !!(doc && profile);
    return html`
      <app-toolbar .fileName=${fileName ?? ''}></app-toolbar>
      <main class=${hasDoc ? '' : 'solo'}>
        <div
          class=${`pad-area ${this._dragging ? 'dragging' : ''}`}
          @dragenter=${this._onDragEnter}
          @dragover=${this._onDragOver}
          @dragleave=${this._onDragLeave}
          @drop=${this._onDrop}
        >
          ${hasDoc ? html`<launchpad-grid></launchpad-grid>` : html`
            <div class="placeholder">
              <div>Drop a Daslight XML file here</div>
              ${loadError ? html`<div class="error">${loadError}</div>` : null}
            </div>
          `}
        </div>
        ${hasDoc ? html`<settings-panel></settings-panel>` : null}
      </main>
    `;
  }

  _onDragEnter(e) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    this._dragDepth++;
    this._dragging = true;
  }
  _onDragOver(e) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  }
  _onDragLeave(e) {
    if (!hasFiles(e)) return;
    this._dragDepth = Math.max(0, this._dragDepth - 1);
    if (this._dragDepth === 0) this._dragging = false;
  }
  async _onDrop(e) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    this._dragDepth = 0;
    this._dragging = false;
    const f = e.dataTransfer?.files?.[0];
    if (!f) return;
    try { await loadFile(f); } catch { /* loadError already in state */ }
  }
}

function hasFiles(e) {
  const types = e.dataTransfer?.types;
  if (!types) return false;
  for (const t of types) if (t === 'Files') return true;
  return false;
}

customElements.define('app-root', AppRoot);

installGlobalSync();

function handleKeyShortcut(e) {
  if (!(e.ctrlKey || e.metaKey)) return;
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
