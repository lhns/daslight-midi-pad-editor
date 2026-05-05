import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/launchpad-grid.js';
import { store } from '../../src/state/store.js';
import { profile as apcMini } from '../../src/devices/akai-apc-mini/profile.js';

function loadFakeApcModel(boundIds = new Set()) {
  // Construct a minimal model: every layout button, only the listed ids bound.
  const buttons = new Map();
  for (const addr of apcMini.layout) {
    buttons.set(addr.id, {
      addr,
      bound: boundIds.has(addr.id),
      states: { off: null, on: null, fade: null },
      shortcutEl: null,
      settingsEl: null,
    });
  }
  store.setState({
    document: {}, // truthy placeholder so AppRoot would not bail; grid uses profile/model directly.
    profile: apcMini,
    fileName: 'fake.xml',
    model: { buttons, shortcuts: [] },
    selection: new Set(),
    selectionAnchor: null,
    validation: { ok: true, offenders: [] },
    clipboard: null,
  });
}

function reset() {
  store.setState({
    document: null, profile: null, fileName: null, model: null,
    selection: new Set(), selectionAnchor: null, validation: null, clipboard: null,
  });
}

describe('<launchpad-grid> click handling', () => {
  afterEach(() => reset());

  it('clicking an unbound button selects it (no silent no-op)', async () => {
    loadFakeApcModel(new Set()); // nothing bound
    const el = await fixture(html`<launchpad-grid></launchpad-grid>`);
    await el.updateComplete;
    const target = el.shadowRoot.querySelector('pad-button');
    expect(target).to.exist;
    target.click();
    expect(store.getState().selection.size).to.equal(1);
  });

  it('clicking a bound button still selects it (no regression)', async () => {
    const oneId = apcMini.layout.find((a) => a.kind === 'grid').id;
    loadFakeApcModel(new Set([oneId]));
    const el = await fixture(html`<launchpad-grid></launchpad-grid>`);
    await el.updateComplete;
    const buttons = el.shadowRoot.querySelectorAll('pad-button');
    // Find the matching pad-button by aria-label (uses addr.id).
    let bound;
    buttons.forEach((b) => {
      const inner = b.shadowRoot.querySelector(`[aria-label="button ${oneId}"]`);
      if (inner) bound = b;
    });
    expect(bound).to.exist;
    bound.click();
    expect(store.getState().selection.has(oneId)).to.equal(true);
  });
});
