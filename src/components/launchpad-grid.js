import { LitElement, html, css } from 'lit';
import { store } from '../state/store.js';
import { selectFromClick } from '../state/actions.js';
import { selectionModeFromEvent } from '../lib/selection.js';
import './pad-button.js';

export class LaunchpadGrid extends LitElement {
  static properties = { _state: { state: true } };

  static styles = css`
    :host { display: block; }
    .grid {
      display: grid;
      gap: 4px;
      background: var(--panel);
      padding: 12px;
      border-radius: 12px;
      border: 1px solid var(--border);
    }
  `;

  constructor() {
    super();
    this._state = store.getState();
    this._unsub = store.subscribe((s) => { this._state = s; });
  }
  disconnectedCallback() { super.disconnectedCallback(); this._unsub?.(); }

  render() {
    const { profile, model, selection } = this._state;
    if (!profile || !model) return null;
    const stateById = new Map((profile.states ?? []).map((s) => [s.id, s]));
    const { rows, cols } = profile.grid;

    const cells = [];
    for (let r = rows; r >= 1; r--) {
      for (let c = 1; c <= cols; c++) {
        const id = `${r},${c}`;
        const m = model.buttons.get(id);
        if (!m) {
          cells.push(html`<div></div>`); // gap (e.g. logo corner on LP MK3)
          continue;
        }
        const states = {
          off: m.states.off?.stateId ? stateById.get(m.states.off.stateId) : null,
          on: m.states.on?.stateId ? stateById.get(m.states.on.stateId) : null,
          fade: m.states.fade?.stateId ? stateById.get(m.states.fade.stateId) : null,
        };
        cells.push(html`
          <pad-button
            .addr=${m.addr}
            .states=${states}
            ?selected=${selection.has(id)}
            ?bound=${m.bound}
            @click=${(ev) => this._onClick(ev, id)}
          ></pad-button>
        `);
      }
    }

    const style = `grid-template-columns: repeat(${cols}, var(--pad-size, 48px)); grid-template-rows: repeat(${rows}, var(--pad-size, 48px));`;
    return html`<div class="grid" style=${style}>${cells}</div>`;
  }

  _onClick(ev, id) {
    const mode = selectionModeFromEvent(ev);
    selectFromClick(id, mode);
  }
}

customElements.define('launchpad-grid', LaunchpadGrid);
