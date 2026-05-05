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

  it('plain click then shift-click produces the bounding rect', async () => {
    loadFakeApcModel(new Set()); // selectability is independent of bound
    const el = await fixture(html`<launchpad-grid></launchpad-grid>`);
    await el.updateComplete;

    function padFor(id) {
      let found;
      el.shadowRoot.querySelectorAll('pad-button').forEach((b) => {
        const inner = b.shadowRoot.querySelector(`[aria-label="button ${id}"]`);
        if (inner) found = b;
      });
      return found;
    }

    padFor('3,2').dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    expect(store.getState().selection.has('3,2')).to.equal(true);
    expect(store.getState().selectionAnchor).to.equal('3,2');

    padFor('5,4').dispatchEvent(new MouseEvent('click', {
      bubbles: true, composed: true, shiftKey: true,
    }));
    const sel = store.getState().selection;
    // rows 3..5 × cols 2..4 = 9 buttons
    expect(sel.size).to.equal(9);
    expect(sel.has('3,2')).to.equal(true);
    expect(sel.has('5,4')).to.equal(true);
    expect(store.getState().selectionAnchor).to.equal('3,2'); // anchor preserved
  });

  it('ctrl-click toggles and updates anchor', async () => {
    loadFakeApcModel(new Set());
    const el = await fixture(html`<launchpad-grid></launchpad-grid>`);
    await el.updateComplete;
    function padFor(id) {
      let found;
      el.shadowRoot.querySelectorAll('pad-button').forEach((b) => {
        const inner = b.shadowRoot.querySelector(`[aria-label="button ${id}"]`);
        if (inner) found = b;
      });
      return found;
    }
    padFor('3,2').dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    padFor('4,4').dispatchEvent(new MouseEvent('click', {
      bubbles: true, composed: true, ctrlKey: true,
    }));
    const s = store.getState();
    expect(s.selection.has('3,2')).to.equal(true);
    expect(s.selection.has('4,4')).to.equal(true);
    expect(s.selectionAnchor).to.equal('4,4');
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
