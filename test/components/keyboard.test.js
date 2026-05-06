import { expect, fixture, html } from '@open-wc/testing';
import '../../src/app.js';
import { store } from '../../src/state/store.js';
import { profile as apcMini } from '../../src/devices/akai-apc-mini/profile.js';

function loadModel(seed) {
  const buttons = new Map();
  for (const addr of apcMini.layout) {
    const init = seed.get(addr.id);
    buttons.set(addr.id, {
      addr,
      bound: !!init,
      states: {
        off:  init?.off  ? { stateId: init.off,  raw: '', dirty: false } : null,
        on:   init?.on   ? { stateId: init.on,   raw: '', dirty: false } : null,
        fade: init?.fade ? { stateId: init.fade, raw: '', dirty: false } : null,
      },
      shortcutEl: null, settingsEl: null,
    });
  }
  store.setState({
    document: {}, profile: apcMini, fileName: 'fake.xml',
    model: { buttons, shortcuts: [] },
    selection: new Set([...seed.keys()]),
    selectionAnchor: null, validation: null, clipboard: null,
    visibleControlStates: new Set(['off', 'on', 'fade']),
  });
}

function reset() {
  store.setState({
    document: null, profile: null, fileName: null, model: null,
    selection: new Set(), selectionAnchor: null, validation: null, clipboard: null,
    visibleControlStates: new Set(['off', 'on', 'fade']),
  });
}

describe('keyboard shortcuts: undo / redo on <app-root>', () => {
  afterEach(() => reset());

  it('Ctrl+Z undoes the last edit; Ctrl+Y replays it', async () => {
    const id = '5,3';
    loadModel(new Map([[id, { on: 'green' }]]));
    await fixture(html`<app-root></app-root>`);
    // simulate an edit by mutating model + pushing a history step manually
    const state = store.getState();
    state.history = { past: [snapshot(state.model)], future: [] };
    state.model.buttons.get(id).states.on = { stateId: 'red', raw: '', dirty: true };
    store.setState({ model: { ...state.model }, history: state.history });

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
    expect(store.getState().model.buttons.get(id).states.on.stateId).to.equal('green');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true }));
    expect(store.getState().model.buttons.get(id).states.on.stateId).to.equal('red');
  });

  it('Ctrl+Shift+Z is treated as redo, not undo', async () => {
    const id = '5,3';
    loadModel(new Map([[id, { on: 'green' }]]));
    await fixture(html`<app-root></app-root>`);
    const state = store.getState();
    state.history = { past: [snapshot(state.model)], future: [] };
    state.model.buttons.get(id).states.on = { stateId: 'red', raw: '', dirty: true };
    store.setState({ model: { ...state.model }, history: state.history });

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
    expect(store.getState().model.buttons.get(id).states.on.stateId).to.equal('green');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true }));
    expect(store.getState().model.buttons.get(id).states.on.stateId).to.equal('red');
  });
});

function snapshot(model) {
  const out = new Map();
  for (const [id, b] of model.buttons) {
    out.set(id, {
      off:  b.states.off  ? { ...b.states.off  } : null,
      on:   b.states.on   ? { ...b.states.on   } : null,
      fade: b.states.fade ? { ...b.states.fade } : null,
    });
  }
  return out;
}

describe('keyboard shortcuts (Ctrl+C / Ctrl+V) on <app-root>', () => {
  afterEach(() => reset());

  it('Ctrl+C populates the clipboard with the visible slots only', async () => {
    loadModel(new Map([['5,3', { off: 'red', on: 'green', fade: 'yellow' }]]));
    store.setState({ visibleControlStates: new Set(['on']) });
    await fixture(html`<app-root></app-root>`);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', ctrlKey: true }));
    expect(store.getState().clipboard).to.deep.equal({ on: 'green' });
  });

  it('Ctrl+V applies the visible slots from the clipboard', async () => {
    const a = '5,3', b = '5,4';
    loadModel(new Map([
      [a, { off: 'red', on: 'green', fade: 'yellow' }],
      [b, { off: 'off', on: 'off', fade: 'off' }],
    ]));
    store.setState({ clipboard: { on: 'green' }, selection: new Set([b]), visibleControlStates: new Set(['on']) });
    await fixture(html`<app-root></app-root>`);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', ctrlKey: true }));
    expect(store.getState().model.buttons.get(b).states.on.stateId).to.equal('green');
    expect(store.getState().model.buttons.get(b).states.off.stateId).to.equal('off'); // off was not in clipboard / not visible
  });
});
