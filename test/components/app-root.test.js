import { expect, fixture, html } from '@open-wc/testing';
import '../../src/app.js';
import { store } from '../../src/state/store.js';
import { profile as apcMini } from '../../src/devices/akai-apc-mini/profile.js';

function reset() {
  store.setState({
    document: null, detectedProfiles: [], profile: null, fileName: null,
    views: new Map(), model: null,
    selection: new Set(), selectionAnchor: null, validation: null, clipboard: null,
    visibleControlStates: new Set(['off', 'on', 'fade']),
    loadError: null,
  });
}

function loadFakeApc() {
  const buttons = new Map();
  for (const addr of apcMini.layout) {
    buttons.set(addr.id, {
      addr, bound: addr.id === '5,3',
      states: { off: null, on: null, fade: null },
      shortcutEl: null, settingsEl: null,
    });
  }
  store.setState({
    document: {}, detectedProfiles: [apcMini], profile: apcMini, fileName: 'fake.xml',
    views: new Map([[apcMini.id, { model: { buttons, shortcuts: [] } }]]),
    model: { buttons, shortcuts: [] },
    selection: new Set(), selectionAnchor: null, validation: { ok: true, offenders: [] },
    clipboard: null, visibleControlStates: new Set(['off','on','fade']),
    loadError: null,
  });
}

describe('<app-root> single-page shell', () => {
  afterEach(() => reset());

  it('without a loaded doc: shows toolbar + drop placeholder; no grid or panel', async () => {
    const el = await fixture(html`<app-root></app-root>`);
    await el.updateComplete;
    expect(el.shadowRoot.querySelector('app-toolbar')).to.exist;
    const placeholder = el.shadowRoot.querySelector('.placeholder');
    expect(placeholder).to.exist;
    expect(placeholder.textContent).to.contain('Drop a Daslight XML file here');
    expect(el.shadowRoot.querySelector('launchpad-grid')).to.equal(null);
    expect(el.shadowRoot.querySelector('settings-panel')).to.equal(null);
  });

  it('with a loaded doc: shows grid + panel; no placeholder', async () => {
    loadFakeApc();
    const el = await fixture(html`<app-root></app-root>`);
    await el.updateComplete;
    expect(el.shadowRoot.querySelector('.placeholder')).to.equal(null);
    expect(el.shadowRoot.querySelector('launchpad-grid')).to.exist;
    expect(el.shadowRoot.querySelector('settings-panel')).to.exist;
  });

  it('shows the loadError text under the drop hint when set', async () => {
    store.setState({ loadError: 'something went wrong' });
    const el = await fixture(html`<app-root></app-root>`);
    await el.updateComplete;
    const err = el.shadowRoot.querySelector('.placeholder .error');
    expect(err).to.exist;
    expect(err.textContent.trim()).to.equal('something went wrong');
  });

  it('main collapses to a single column when no panel renders', async () => {
    const el = await fixture(html`<app-root></app-root>`);
    await el.updateComplete;
    const main = el.shadowRoot.querySelector('main');
    expect(main.classList.contains('solo')).to.equal(true);
  });
});
