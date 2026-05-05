import { LitElement, html, css } from 'lit';
import { store } from '../state/store.js';
import {
  setAxisOnSelection,
  copyAll, copyMode, pasteAll, pasteMode,
} from '../state/actions.js';
import { buttonStyles } from '../styles/buttons.js';
import './color-palette.js';

const CONTROL_LABELS = { off: 'Off', on: 'On', fade: 'Fade' };

export class SettingsPanel extends LitElement {
  static properties = {
    _state: { state: true },
    _open: { state: true }, // {off:bool, on:bool, fade:bool}
  };

  static styles = [buttonStyles, css`
    :host {
      display: block;
      width: 360px;
      max-width: 40vw;
      background: var(--panel);
      border-left: 1px solid var(--border);
      padding: 1rem;
      box-sizing: border-box;
      height: 100%;
      max-height: 100%;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
    }
    @media (max-width: 700px) {
      :host {
        width: 100%;
        max-width: 100%;
        height: auto;
        max-height: none;
        border-left: none;
        border-top: 1px solid var(--border);
        overflow-y: visible;
      }
    }
    h2 { margin-top: 0; font-size: 1rem; }
    .empty { color: var(--muted); }
    .swatch {
      width: 22px; height: 22px; border-radius: 4px;
      display: inline-block; vertical-align: middle;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .actions {
      display: flex; gap: 0.5rem; flex-wrap: wrap;
      margin-bottom: 0.75rem;
    }
    details {
      border: 1px solid var(--border);
      border-radius: var(--radius);
      margin-bottom: 0.5rem;
      background: var(--bg);
    }
    details[open] { background: var(--panel-2); }
    summary {
      list-style: none;
      cursor: pointer;
      padding: 0.55rem 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      user-select: none;
    }
    summary::-webkit-details-marker { display: none; }
    summary::before {
      content: '▸';
      transition: transform 0.15s;
      color: var(--muted);
    }
    details[open] summary::before { transform: rotate(90deg); }
    .summary-label { flex: 1; font-weight: 500; }
    .summary-preview { color: var(--muted); font-size: 0.85rem; }
    .body {
      padding: 0.5rem 0.75rem 0.75rem;
      border-top: 1px solid var(--border);
    }
    .mode-actions {
      display: flex; gap: 0.5rem; margin-top: 0.6rem;
    }
    .unbound-warn {
      background: rgba(217, 119, 6, 0.15);
      color: var(--warn);
      border: 1px solid rgba(217, 119, 6, 0.4);
      border-radius: var(--radius);
      padding: 0.5rem 0.6rem;
      margin-bottom: 0.6rem;
      font-size: 0.85rem;
    }
  `];

  constructor() {
    super();
    this._state = store.getState();
    this._unsub = store.subscribe((s) => { this._state = s; });
    this._open = { off: true, on: true, fade: true };
  }
  disconnectedCallback() { super.disconnectedCallback(); this._unsub?.(); }

  render() {
    const { profile, model, selection, clipboard, visibleControlStates } = this._state;
    if (!profile || !model) return null;
    if (selection.size === 0) {
      return html`
        <h2>Inspector</h2>
        <div class="empty">Click a button to edit. Hold Shift for a rectangle, Ctrl/Cmd to toggle.</div>
      `;
    }
    const buttons = [...selection].map((id) => model.buttons.get(id)).filter(Boolean);
    const unbound = buttons.filter((b) => !b.bound);
    const allowedColorIds = intersect(buttons.map((b) => b.addr.allowedColorIds));
    const single = buttons.length === 1 ? buttons[0] : null;

    const clipboardHasAny = clipboard && Object.values(clipboard).some((v) => v != null);

    return html`
      <h2>${single ? `Button ${single.addr.id}` : `${buttons.length} buttons selected`}</h2>

      ${unbound.length ? html`
        <div class="unbound-warn">
          ${unbound.length} of ${buttons.length} selected button(s) are not mapped to a Daslight scene — map them in Daslight first to enable LED edits.
        </div>
      ` : null}

      <div class="actions">
        ${single ? html`<button class="primary" @click=${() => copyAll(single.addr.id)}>Copy all</button>` : null}
        <button ?disabled=${!clipboardHasAny} @click=${() => pasteAll()}>
          Paste all${clipboardHasAny ? '' : ' (empty)'}
        </button>
      </div>

      ${['off','on','fade']
        .filter((c) => !visibleControlStates || visibleControlStates.has(c))
        .map((ctrl) => this._renderSection(ctrl, buttons, profile, allowedColorIds, single, clipboard))}
    `;
  }

  _renderSection(ctrl, buttons, profile, allowedColorIds, single, clipboard) {
    const sharedStateId = sharedValue(buttons.map((b) => b.states[ctrl]?.stateId ?? null));
    const sharedState = sharedStateId ? profile.states.find((s) => s.id === sharedStateId) : null;
    const isOpen = this._open[ctrl];
    const clipHas = clipboard && clipboard[ctrl] != null;

    return html`
      <details ?open=${isOpen} @toggle=${(e) => this._open = { ...this._open, [ctrl]: e.currentTarget.open }}>
        <summary>
          <span class="summary-label">${CONTROL_LABELS[ctrl]}</span>
          <span class="summary-preview">${this._previewLabel(sharedState, sharedStateId, buttons.length)}</span>
          ${sharedState ? html`<span class="swatch" style=${`background:${sharedState.hex}`}></span>` : null}
        </summary>
        <div class="body">
          <color-palette
            .profile=${profile}
            .allowedColorIds=${allowedColorIds}
            .selectedStateId=${sharedStateId ?? ''}
            @color-pick=${(e) => setAxisOnSelection(ctrl, 'color', e.detail.colorId)}
            @mode-pick=${(e) => setAxisOnSelection(ctrl, 'mode', e.detail.modeId)}
          ></color-palette>
          <div class="mode-actions">
            ${single ? html`<button @click=${() => copyMode(single.addr.id, ctrl)}>Copy</button>` : null}
            <button ?disabled=${!clipHas} @click=${() => pasteMode(ctrl)}>
              Paste${clipHas ? '' : ' (empty)'}
            </button>
          </div>
        </div>
      </details>
    `;
  }

  _previewLabel(sharedState, sharedStateId, count) {
    if (sharedState) return sharedState.label;
    if (sharedStateId === null && count > 1) return 'mixed';
    return 'unset';
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
