import { LitElement, html, css } from 'lit';
import { store } from '../state/store.js';
import { applyToSelection, copyFromButton, pasteToSelection } from '../state/actions.js';
import './color-palette.js';

const CONTROL_LABELS = { off: 'Off', on: 'On', fade: 'Fade' };

export class SettingsPanel extends LitElement {
  static properties = {
    _state: { state: true },
    _activeControl: { state: true },
  };

  static styles = css`
    :host {
      display: block;
      width: 360px;
      max-width: 40vw;
      background: var(--panel);
      border-left: 1px solid var(--border);
      padding: 1rem;
      overflow: auto;
    }
    h2 { margin-top: 0; font-size: 1rem; }
    .row { display: flex; align-items: center; gap: 0.5rem; margin: 0.5rem 0; }
    .pill {
      padding: 4px 10px; border-radius: 12px;
      background: var(--panel-2); border: 1px solid var(--border);
      cursor: pointer; font-size: 0.85rem;
    }
    .pill.active { outline: 2px solid var(--accent); }
    .empty { color: var(--muted); }
    .unbound-warn {
      background: rgba(217, 119, 6, 0.15);
      color: var(--warn);
      border: 1px solid rgba(217, 119, 6, 0.4);
      border-radius: var(--radius);
      padding: 0.5rem 0.6rem;
      margin-bottom: 0.6rem;
      font-size: 0.85rem;
    }
    .swatch { width: 22px; height: 22px; border-radius: 4px; display: inline-block; vertical-align: middle; }
    section { border-top: 1px solid var(--border); padding-top: 0.75rem; margin-top: 0.75rem; }
    .actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  `;

  constructor() {
    super();
    this._state = store.getState();
    this._unsub = store.subscribe((s) => { this._state = s; });
    this._activeControl = 'on';
  }
  disconnectedCallback() { super.disconnectedCallback(); this._unsub?.(); }

  render() {
    const { profile, model, selection, clipboard } = this._state;
    if (!profile || !model) return null;
    if (selection.size === 0) {
      return html`<h2>Inspector</h2><div class="empty">Click a button to edit. Hold Shift / Ctrl / Cmd to multi-select.</div>`;
    }
    const buttons = [...selection].map((id) => model.buttons.get(id)).filter(Boolean);
    const unbound = buttons.filter((b) => !b.bound);
    const allowed = intersect(buttons.map((b) => b.addr.allowedStateIds));
    const ctrl = this._activeControl;
    const sharedStateId = sharedValue(buttons.map((b) => b.states[ctrl]?.stateId ?? null));
    const sharedState = sharedStateId ? profile.states.find((s) => s.id === sharedStateId) : null;

    const single = buttons.length === 1 ? buttons[0] : null;

    return html`
      <h2>${buttons.length === 1 ? `Button ${buttons[0].addr.id}` : `${buttons.length} buttons selected`}</h2>

      ${unbound.length ? html`
        <div class="unbound-warn">
          ${unbound.length} of ${buttons.length} selected button(s) are not mapped to a Daslight scene — map them in Daslight first to enable LED edits.
        </div>
      ` : null}

      <div class="row">
        ${Object.entries(CONTROL_LABELS).map(([k, label]) => html`
          <button
            class=${`pill ${ctrl === k ? 'active' : ''}`}
            @click=${() => this._activeControl = k}
          >${label}</button>
        `)}
      </div>

      <section>
        <div class="row">
          <span>Current:</span>
          ${sharedState ? html`
            <span class="swatch" style=${`background:${sharedState.hex}`}></span>
            <span>${sharedState.label}</span>
          ` : sharedStateId === null && buttons.length > 1 ? html`<span class="empty">mixed</span>`
            : html`<span class="empty">unset</span>`}
        </div>
        <color-palette
          .profile=${profile}
          .allowedStateIds=${allowed}
          .selectedStateId=${sharedStateId ?? ''}
          @state-pick=${(e) => applyToSelection(ctrl, e.detail.stateId)}
        ></color-palette>
      </section>

      <section>
        <div class="actions">
          ${single ? html`
            <button @click=${() => copyFromButton(single.addr.id)}>Copy</button>
          ` : null}
          <button ?disabled=${!clipboard} @click=${() => pasteToSelection()}>
            Paste${clipboard ? '' : ' (empty)'}
          </button>
        </div>
      </section>
    `;
  }
}

function intersect(arrays) {
  if (!arrays.length) return [];
  return arrays.reduce((acc, cur) => acc.filter((x) => cur.includes(x)));
}

function sharedValue(values) {
  if (!values.length) return null;
  const first = values[0];
  return values.every((v) => v === first) ? first : null;
}

customElements.define('settings-panel', SettingsPanel);
