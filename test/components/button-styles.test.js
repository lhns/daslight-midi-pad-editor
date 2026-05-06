import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/launchpad-grid.js';
import '../../src/components/settings-panel.js';
import { profile as apcMini } from '../../src/devices/akai-apc-mini/profile.js';
import { store } from '../../src/state/store.js';

function reset() {
  store.setState({
    document: null, profile: null, fileName: null, model: null,
    selection: new Set(), selectionAnchor: null, validation: null, clipboard: null,
    visibleControlStates: new Set(['off', 'on', 'fade']),
  });
}

describe('shared button styles', () => {
  afterEach(() => reset());

  it('mode buttons in the settings-panel side-col have the shared border-radius', async () => {
    // Seed a single-button selection so the panel renders accordion bodies
    // with picker-row + side-col (containing the mode buttons).
    const buttons = new Map();
    for (const addr of apcMini.layout) {
      const seed = addr.id === '5,3';
      buttons.set(addr.id, {
        addr,
        bound: seed,
        states: seed
          ? { off: null, on: { stateId: 'green', raw: '', dirty: false }, fade: null }
          : { off: null, on: null, fade: null },
        shortcutEl: null, settingsEl: null,
      });
    }
    store.setState({
      document: {}, profile: apcMini, fileName: 'fake.xml',
      model: { buttons, shortcuts: [] },
      selection: new Set(['5,3']),
      selectionAnchor: null, validation: null, clipboard: null,
      visibleControlStates: new Set(['off','on','fade']),
    });
    const el = await fixture(html`<settings-panel></settings-panel>`);
    await el.updateComplete;
    const modeBtn = el.shadowRoot.querySelector('details .side-col button');
    expect(modeBtn).to.exist;
    expect(getComputedStyle(modeBtn).borderRadius).not.to.equal('0px');
  });

  it('aria-pressed pills in <launchpad-grid> have a distinct border-color from idle pills', async () => {
    // Seed a minimal model so the grid renders pills.
    const buttons = new Map();
    for (const addr of apcMini.layout) {
      buttons.set(addr.id, { addr, bound: false, states: { off: null, on: null, fade: null }, shortcutEl: null, settingsEl: null });
    }
    store.setState({
      document: {}, profile: apcMini, fileName: 'fake.xml',
      model: { buttons, shortcuts: [] },
      selection: new Set(), selectionAnchor: null, validation: { ok: true, offenders: [] }, clipboard: null,
      visibleControlStates: new Set(['off', 'on']), // off/on pressed; fade NOT
    });
    const el = await fixture(html`<launchpad-grid></launchpad-grid>`);
    await el.updateComplete;
    const pills = el.shadowRoot.querySelectorAll('.pill');
    const pressed = [...pills].find((p) => p.getAttribute('aria-pressed') === 'true');
    const idle = [...pills].find((p) => p.getAttribute('aria-pressed') === 'false');
    expect(pressed).to.exist;
    expect(idle).to.exist;
    expect(getComputedStyle(pressed).borderColor).not.to.equal(getComputedStyle(idle).borderColor);
  });
});
