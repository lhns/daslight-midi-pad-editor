import { LitElement, html, css } from 'lit';
import { loadFile } from '../state/actions.js';
import { buttonStyles } from '../styles/buttons.js';

export class DropZone extends LitElement {
  static properties = {
    _hover: { state: true },
    _error: { state: true },
  };

  static styles = [
    buttonStyles,
    css`
      :host { display: block; width: min(720px, 90vw); }
      .zone {
        border: 2px dashed var(--border);
        border-radius: 12px;
        padding: 4rem 2rem;
        text-align: center;
        background: var(--panel);
        transition: border-color 0.15s, background 0.15s;
      }
      .zone.hover { border-color: var(--accent); background: var(--panel-2); }
      h1 { margin: 0 0 0.5rem; font-size: 1.5rem; }
      p { color: var(--muted); margin: 0.25rem 0; }
      label { display: inline-block; margin-top: 1rem; }
      input[type=file] { display: none; }
      .error { color: var(--danger); margin-top: 1rem; white-space: pre-wrap; }
    `,
  ];

  constructor() {
    super();
    this._hover = false;
    this._error = null;
  }

  render() {
    return html`
      <div
        class="zone ${this._hover ? 'hover' : ''}"
        @dragenter=${this._onDragEnter}
        @dragover=${this._onDragOver}
        @dragleave=${this._onDragLeave}
        @drop=${this._onDrop}
      >
        <h1>Daslight MIDI Pad Editor</h1>
        <p>Drop a Daslight XML file here</p>
        <p>or</p>
        <label>
          <input type="file" accept=".xml,application/xml,text/xml" @change=${this._onPick} />
          <button type="button" class="primary" @click=${this._openPicker}>Choose file…</button>
        </label>
        ${this._error ? html`<div class="error">${this._error}</div>` : null}
      </div>
    `;
  }

  _onDragEnter(e) { e.preventDefault(); this._hover = true; }
  _onDragOver(e)  { e.preventDefault(); }
  _onDragLeave()  { this._hover = false; }
  async _onDrop(e) {
    e.preventDefault();
    this._hover = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) await this._tryLoad(f);
  }
  _openPicker(e) {
    this.renderRoot.querySelector('input[type=file]').click();
  }
  async _onPick(e) {
    const f = e.target.files?.[0];
    if (f) await this._tryLoad(f);
  }
  async _tryLoad(file) {
    this._error = null;
    try {
      await loadFile(file);
    } catch (err) {
      this._error = String(err?.message ?? err);
    }
  }
}

customElements.define('drop-zone', DropZone);
