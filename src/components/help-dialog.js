import { LitElement, html, css } from 'lit';
import { buttonStyles } from '../styles/buttons.js';

// Modal dialog showing every keyboard / mouse shortcut the editor supports.
// Uses the native <dialog> element so the browser handles the top-layer,
// the Esc-to-close, and the focus trap. Backdrop-click is wired manually.
export class HelpDialog extends LitElement {
  static styles = [
    buttonStyles,
    css`
      :host { display: contents; }
      dialog {
        border: 1px solid var(--border, #2c2f37);
        border-radius: 8px;
        background: var(--panel, #1a1c21);
        color: var(--fg, #e7e9ee);
        padding: 0;
        max-width: min(560px, 90vw);
        max-height: 80vh;
        overflow: hidden;
        font: inherit;
      }
      /* Scope display:flex to the OPEN state — without [open] the rule
         overrides the native dialog's default display:none and the dialog
         stays visible (and blocks the page) even when closed. */
      dialog[open] {
        display: flex;
        flex-direction: column;
      }
      dialog::backdrop { background: rgba(0, 0, 0, 0.55); }
      .head {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--border, #2c2f37);
      }
      .head h2 {
        margin: 0;
        font-size: 1rem;
        flex: 1;
      }
      .body {
        flex: 1 1 auto;
        min-height: 0;          /* required so overflow-y: auto actually engages */
        overflow-y: auto;
        padding: 1rem;
      }
      section + section { margin-top: 1.25rem; }
      section h3 {
        margin: 0 0 0.5rem;
        font-size: 0.75rem;
        color: var(--muted, #8b909a);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      dl.shortcuts {
        display: grid;
        grid-template-columns: auto 1fr;
        column-gap: 1rem;
        row-gap: 0.45rem;
        margin: 0;
        align-items: baseline;
      }
      dl.shortcuts dt {
        display: flex;
        gap: 4px;
        align-items: center;
        flex-wrap: wrap;
      }
      dl.shortcuts dd {
        margin: 0;
        font-size: 0.9rem;
        color: var(--fg, #e7e9ee);
      }
      kbd {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.78rem;
        background: rgba(255, 255, 255, 0.07);
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-bottom-width: 2px;
        border-radius: 4px;
        padding: 1px 6px;
        white-space: nowrap;
      }
      .plus { color: var(--muted, #8b909a); padding: 0 2px; }
    `,
  ];

  constructor() {
    super();
    this._onDialogClick = (e) => {
      // Native click on the dialog whose target IS the dialog itself
      // (not one of its children) is a click on the backdrop area.
      if (e.target === this._dlg) this.close();
    };
  }

  get _dlg() { return this.renderRoot?.querySelector('dialog'); }

  open() {
    const dlg = this._dlg;
    if (!dlg || dlg.open) return;
    dlg.showModal();
  }

  close() {
    const dlg = this._dlg;
    if (dlg?.open) dlg.close();
  }

  firstUpdated() {
    this._dlg?.addEventListener('click', this._onDialogClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._dlg?.removeEventListener('click', this._onDialogClick);
  }

  render() {
    return html`
      <dialog aria-labelledby="help-title">
        <div class="head">
          <h2 id="help-title">Keyboard &amp; mouse shortcuts</h2>
          <button class="close" type="button" @click=${() => this.close()}>Close</button>
        </div>
        <div class="body">
          <section>
            <h3>Selection on the pad</h3>
            <dl class="shortcuts">
              <dt><kbd>Click</kbd></dt>
              <dd>Select a single button (sets the rectangle anchor).</dd>

              <dt><kbd>Shift</kbd><span class="plus">+</span><kbd>Click</kbd></dt>
              <dd>Range-select the 2D rectangle from the anchor to here.</dd>

              <dt><kbd>Ctrl</kbd><span class="plus">/</span><kbd>⌘</kbd><span class="plus">+</span><kbd>Click</kbd></dt>
              <dd>Toggle a single button in the selection (and update the anchor).</dd>
            </dl>
          </section>

          <section>
            <h3>Edit</h3>
            <dl class="shortcuts">
              <dt>Pills above the pad</dt>
              <dd>Show / hide Off, On, Fade stripes — also filters which clipboard slots Ctrl+C / Ctrl+V touch.</dd>

              <dt>Color swatches</dt>
              <dd>Click a swatch to set the current selection's color in the open accordion section.</dd>

              <dt>Mode buttons</dt>
              <dd>Static / Flash / Pulse — set the LED mode without changing the color.</dd>
            </dl>
          </section>

          <section>
            <h3>Copy &amp; paste</h3>
            <dl class="shortcuts">
              <dt><kbd>Ctrl</kbd><span class="plus">/</span><kbd>⌘</kbd><span class="plus">+</span><kbd>C</kbd></dt>
              <dd>Copy the visible-pill slots from the first bound button in the selection.</dd>

              <dt><kbd>Ctrl</kbd><span class="plus">/</span><kbd>⌘</kbd><span class="plus">+</span><kbd>V</kbd></dt>
              <dd>Paste the visible-pill slots onto every selected bound button.</dd>

              <dt>Per-section <em>Copy</em> / <em>Paste</em></dt>
              <dd>Same as the keyboard, scoped to that section. Paste falls back to the most recently copied slot when its own slot is empty — the button's tooltip shows the source.</dd>
            </dl>
          </section>

          <section>
            <h3>History</h3>
            <dl class="shortcuts">
              <dt><kbd>Ctrl</kbd><span class="plus">/</span><kbd>⌘</kbd><span class="plus">+</span><kbd>Z</kbd></dt>
              <dd>Undo the last edit.</dd>

              <dt><kbd>Ctrl</kbd><span class="plus">/</span><kbd>⌘</kbd><span class="plus">+</span><kbd>Y</kbd></dt>
              <dd>Redo.</dd>

              <dt><kbd>Ctrl</kbd><span class="plus">/</span><kbd>⌘</kbd><span class="plus">+</span><kbd>Shift</kbd><span class="plus">+</span><kbd>Z</kbd></dt>
              <dd>Redo (alternative).</dd>
            </dl>
          </section>

          <section>
            <h3>File</h3>
            <dl class="shortcuts">
              <dt>Drop XML on pad</dt>
              <dd>Load a Daslight XML file (works in the empty state and to replace the current one).</dd>

              <dt>Toolbar: <em>Open file</em></dt>
              <dd>Pick a Daslight XML file from disk.</dd>

              <dt>Toolbar: <em>Download XML</em></dt>
              <dd>Save the current edits back to a file.</dd>
            </dl>
          </section>
        </div>
      </dialog>
    `;
  }
}

customElements.define('help-dialog', HelpDialog);
