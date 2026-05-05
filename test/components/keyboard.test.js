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
