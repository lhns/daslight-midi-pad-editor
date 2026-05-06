import { LitElement, html, css } from 'lit';
import { store } from '../state/store.js';
import { selectFromClick, toggleControlStateVisibility } from '../state/actions.js';
import { selectionModeFromEvent } from '../lib/selection.js';
import { buttonStyles } from '../styles/buttons.js';

const CONTROL_LABELS = { off: 'Off', on: 'On', fade: 'Fade' };
const CONTROL_ORDER = ['off', 'on', 'fade'];
import './pad-button.js';

export class LaunchpadGrid extends LitElement {
  static properties = { _state: { state: true } };

  static styles = [
    buttonStyles,
    css`
      :host {
        display: block;
        --pad-size: clamp(28px, min(8vw, 7vh), 48px);
        --pad-gap: clamp(2px, 0.5vw, 4px);
      }
      .filter {
        display: flex;
        gap: 6px;
        justify-content: center;
        margin-bottom: 8px;
      }
      .grid {
        display: grid;
        gap: var(--pad-gap);
        background: var(--panel);
        padding: clamp(6px, 1.5vw, 12px);
        border-radius: 12px;
        border: 1px solid var(--border);
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
    const { profile, model, selection, visibleControlStates } = this._state;
    if (!profile || !model) return null;
    const stateById = new Map((profile.states ?? []).map((s) => [s.id, s]));
    const { rows, cols } = profile.grid;
    const visible = CONTROL_ORDER.filter((c) => visibleControlStates.has(c));

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
            .visibleControlStates=${visible}
            .flashStrategy=${profile.flashStrategy ?? 'black'}
            shape=${m.addr.shape ?? (m.addr.kind === 'round' ? 'circle' : 'rect')}
            ?selected=${selection.has(id)}
            ?bound=${m.bound}
            @click=${(ev) => this._onClick(ev, id)}
          ></pad-button>
        `);
      }
    }

    const colMults = profile.gridTemplate?.columns ?? new Array(cols).fill(1);
    const rowMults = profile.gridTemplate?.rows ?? new Array(rows).fill(1);
    const cellSize = (mult) => `calc(var(--pad-size, 48px) * ${mult})`;
    const style = `grid-template-columns: ${colMults.map(cellSize).join(' ')}; grid-template-rows: ${rowMults.map(cellSize).join(' ')};`;
    return html`
      <div class="filter" role="group" aria-label="Visible control states">
        ${CONTROL_ORDER.map((c) => html`
          <button
            class="pill"
            type="button"
            aria-pressed=${visibleControlStates.has(c) ? 'true' : 'false'}
            @click=${() => toggleControlStateVisibility(c)}
          >${CONTROL_LABELS[c]}</button>
        `)}
      </div>
      <div class="grid" style=${style}>${cells}</div>
    `;
  }

  _onClick(ev, id) {
    const mode = selectionModeFromEvent(ev);
    selectFromClick(id, mode);
  }
}

customElements.define('launchpad-grid', LaunchpadGrid);
