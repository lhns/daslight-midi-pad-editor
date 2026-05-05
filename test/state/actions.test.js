import { expect } from '@open-wc/testing';
import { store } from '../../src/state/store.js';
import { setAxisOnSelection, applyStateToSelection, toggleControlStateVisibility, copyVisible, pasteVisible } from '../../src/state/actions.js';
import { profile as apcMini } from '../../src/devices/akai-apc-mini/profile.js';
import { profile as lpMk3 } from '../../src/devices/launchpad-mini-mk3/profile.js';

function loadModel(profile, initial) {
  // initial = Map<addrId, { off?, on?, fade? }> of stateIds to seed
  const buttons = new Map();
  for (const addr of profile.layout) {
    const seed = initial.get(addr.id);
    buttons.set(addr.id, {
      addr,
      bound: !!seed,
      states: {
        off:  seed?.off  ? { stateId: seed.off,  raw: '', dirty: false } : null,
        on:   seed?.on   ? { stateId: seed.on,   raw: '', dirty: false } : null,
        fade: seed?.fade ? { stateId: seed.fade, raw: '', dirty: false } : null,
      },
      shortcutEl: null, settingsEl: null,
    });
  }
  store.setState({
    document: {}, profile, fileName: 'fake.xml',
    model: { buttons, shortcuts: [] },
    selection: new Set([...initial.keys()]),
    selectionAnchor: null, validation: null, clipboard: null,
  });
}

function reset() {
  store.setState({
    document: null, profile: null, fileName: null, model: null,
    selection: new Set(), selectionAnchor: null, validation: null, clipboard: null,
  });
}

describe('setAxisOnSelection', () => {
  afterEach(() => reset());

  it('changing mode in a mixed-color selection preserves each button color', () => {
    // pick two main-grid APC mini buttons, seed with red and green (both static)
    const a = apcMini.layout.find((x) => x.id === '5,3');
    const b = apcMini.layout.find((x) => x.id === '5,4');
    loadModel(apcMini, new Map([[a.id, { on: 'red' }], [b.id, { on: 'green' }]]));

    setAxisOnSelection('on', 'mode', 'flash');

    const m = store.getState().model;
    expect(m.buttons.get(a.id).states.on.stateId).to.equal('red-blink');
    expect(m.buttons.get(b.id).states.on.stateId).to.equal('green-blink');
  });

  it('changing color in a mixed-mode selection preserves each button mode', () => {
    const a = apcMini.layout.find((x) => x.id === '5,3');
    const b = apcMini.layout.find((x) => x.id === '5,4');
    loadModel(apcMini, new Map([[a.id, { on: 'green' }], [b.id, { on: 'green-blink' }]]));

    setAxisOnSelection('on', 'color', 'red');

    const m = store.getState().model;
    expect(m.buttons.get(a.id).states.on.stateId).to.equal('red');
    expect(m.buttons.get(b.id).states.on.stateId).to.equal('red-blink');
  });

  it('skips buttons whose allowedColorIds rejects the new color', () => {
    // track row only allows off/red — picking green is dropped silently.
    const trackBtn = apcMini.layout.find((x) => x.row === 1 && x.col === 3);
    loadModel(apcMini, new Map([[trackBtn.id, { on: 'red' }]]));

    setAxisOnSelection('on', 'color', 'green');

    expect(store.getState().model.buttons.get(trackBtn.id).states.on.stateId).to.equal('red');
  });

  it('falls back to defaultStateId when the slot is empty', () => {
    const a = lpMk3.layout.find((x) => x.id === '5,3');
    loadModel(lpMk3, new Map([[a.id, {}]])); // bound but no on-state seeded

    setAxisOnSelection('on', 'color', '5');
    // default mode is static, so the result is lp:5:static
    expect(store.getState().model.buttons.get(a.id).states.on.stateId).to.equal('lp:5:static');
  });
});

describe('toggleControlStateVisibility', () => {
  afterEach(() => reset());

  it('removes a state from the visible set', () => {
    store.setState({ visibleControlStates: new Set(['off', 'on', 'fade']) });
    toggleControlStateVisibility('off');
    expect([...store.getState().visibleControlStates].sort()).to.deep.equal(['fade', 'on']);
  });

  it('re-adds a previously hidden state', () => {
    store.setState({ visibleControlStates: new Set(['on', 'fade']) });
    toggleControlStateVisibility('off');
    expect(store.getState().visibleControlStates.has('off')).to.equal(true);
  });

  it('cannot empty the set — last toggle-off is a no-op', () => {
    store.setState({ visibleControlStates: new Set(['on']) });
    toggleControlStateVisibility('on');
    expect([...store.getState().visibleControlStates]).to.deep.equal(['on']);
  });
});

describe('copyVisible / pasteVisible (Ctrl+C / Ctrl+V honoring pill filter)', () => {
  afterEach(() => reset());

  it('copyVisible only writes the visible slots into the clipboard', () => {
    const id = '5,3';
    loadModel(apcMini, new Map([[id, { off: 'red', on: 'green', fade: 'yellow' }]]));
    store.setState({ visibleControlStates: new Set(['on']) });
    copyVisible();
    expect(store.getState().clipboard).to.deep.equal({ on: 'green' });
  });

  it('pasteVisible only writes the slots that are both in the clipboard and visible', () => {
    const a = '5,3', b = '5,4';
    loadModel(apcMini, new Map([
      [a, { off: 'red', on: 'green', fade: 'yellow' }],
      [b, { off: 'off', on: 'off', fade: 'off' }],
    ]));
    // copy with all three pills, then narrow to {on, fade} and paste onto b.
    store.setState({ visibleControlStates: new Set(['off','on','fade']) });
    copyVisible();
    store.setState({ selection: new Set([b]), visibleControlStates: new Set(['on','fade']) });
    pasteVisible();
    const m = store.getState().model.buttons.get(b);
    expect(m.states.on.stateId).to.equal('green');
    expect(m.states.fade.stateId).to.equal('yellow');
    expect(m.states.off.stateId).to.equal('off'); // hidden slot untouched
  });

  it('pasteVisible skips visible slots that are not in the clipboard', () => {
    const a = '5,3', b = '5,4';
    loadModel(apcMini, new Map([
      [a, { off: 'red', on: 'green', fade: 'yellow' }],
      [b, { off: 'off', on: 'off', fade: 'off' }],
    ]));
    store.setState({ visibleControlStates: new Set(['on']) });
    copyVisible(); // clipboard = { on: 'green' }
    store.setState({ selection: new Set([b]), visibleControlStates: new Set(['on','fade']) });
    pasteVisible();
    const m = store.getState().model.buttons.get(b);
    expect(m.states.on.stateId).to.equal('green');
    expect(m.states.fade.stateId).to.equal('off'); // not in clipboard, skipped
  });

  it('copyVisible falls back to the first bound button when several are selected', () => {
    const a = '5,3', b = '5,4';
    loadModel(apcMini, new Map([
      [a, { on: 'red' }],
      [b, { on: 'green' }],
    ]));
    store.setState({ selection: new Set([a, b]), visibleControlStates: new Set(['on']) });
    copyVisible();
    // Set is unordered for iteration but in V8 insertion order is preserved.
    expect(['red', 'green']).to.include(store.getState().clipboard.on);
  });
});

describe('applyStateToSelection', () => {
  afterEach(() => reset());

  it('writes the provided stateId verbatim across the selection', () => {
    const a = apcMini.layout.find((x) => x.id === '5,3');
    const b = apcMini.layout.find((x) => x.id === '5,4');
    loadModel(apcMini, new Map([[a.id, { on: 'red' }], [b.id, { on: 'green' }]]));

    applyStateToSelection('on', 'yellow-blink');

    expect(store.getState().model.buttons.get(a.id).states.on.stateId).to.equal('yellow-blink');
    expect(store.getState().model.buttons.get(b.id).states.on.stateId).to.equal('yellow-blink');
  });
});
