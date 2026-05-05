import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/settings-panel.js';
import { store } from '../../src/state/store.js';
import { copyAll, copyMode, pasteAll, pasteMode } from '../../src/state/actions.js';
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
  });
}

function reset() {
  store.setState({
    document: null, profile: null, fileName: null, model: null,
    selection: new Set(), selectionAnchor: null, validation: null, clipboard: null,
  });
}

describe('<settings-panel>', () => {
  afterEach(() => reset());

  it('renders three accordion details (off/on/fade)', async () => {
    loadModel(new Map([['5,3', { off: 'off', on: 'green', fade: 'red-blink' }]]));
    const el = await fixture(html`<settings-panel></settings-panel>`);
    await el.updateComplete;
    const details = el.shadowRoot.querySelectorAll('details');
    expect(details.length).to.equal(3);
    const labels = [...details].map((d) => d.querySelector('.summary-label').textContent.trim());
    expect(labels).to.deep.equal(['Off', 'On', 'Fade']);
  });

  it('per-mode copy seeds only that slot in the clipboard', async () => {
    const id = '5,3';
    loadModel(new Map([[id, { off: 'off', on: 'green', fade: 'red-blink' }]]));
    copyMode(id, 'on');
    expect(store.getState().clipboard).to.deep.equal({ on: 'green' });
    expect(store.getState().clipboard.off).to.equal(undefined);
  });

  it('paste all writes every populated clipboard slot', async () => {
    const a = '5,3', b = '5,4';
    loadModel(new Map([
      [a, { off: 'off', on: 'green', fade: 'red-blink' }],
      [b, { off: 'off', on: 'off', fade: 'off' }],
    ]));
    copyAll(a);
    store.setState({ selection: new Set([b]) });
    pasteAll();
    const m = store.getState().model.buttons.get(b);
    expect(m.states.on.stateId).to.equal('green');
    expect(m.states.fade.stateId).to.equal('red-blink');
  });

  it('paste mode writes only that slot, leaving the others untouched', async () => {
    const a = '5,3', b = '5,4';
    loadModel(new Map([
      [a, { off: 'red', on: 'green', fade: 'yellow' }],
      [b, { off: 'off', on: 'off', fade: 'off' }],
    ]));
    copyMode(a, 'on'); // clipboard = { on: 'green' }
    store.setState({ selection: new Set([b]) });
    pasteMode('on');
    const m = store.getState().model.buttons.get(b);
    expect(m.states.on.stateId).to.equal('green');
    expect(m.states.off.stateId).to.equal('off');
    expect(m.states.fade.stateId).to.equal('off');
  });

  it('paste mode is a no-op when the clipboard slot is empty', async () => {
    const id = '5,3';
    loadModel(new Map([[id, { off: 'off', on: 'green', fade: 'off' }]]));
    pasteMode('on'); // no clipboard yet
    expect(store.getState().model.buttons.get(id).states.on.stateId).to.equal('green');
  });

  it('shows the unbound warning banner when selection contains unmapped buttons', async () => {
    loadModel(new Map([['5,3', null]])); // bound:false because seed value is null
    const el = await fixture(html`<settings-panel></settings-panel>`);
    await el.updateComplete;
    const warn = el.shadowRoot.querySelector('.unbound-warn');
    expect(warn).to.exist;
  });
});
