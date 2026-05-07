import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/toolbar.js';
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

describe('<app-toolbar>', () => {
  afterEach(() => reset());

  it('shows "Open file" as the left-most button', async () => {
    const el = await fixture(html`<app-toolbar></app-toolbar>`);
    await el.updateComplete;
    const buttons = el.shadowRoot.querySelectorAll('.bar > button');
    expect(buttons[0].textContent.trim()).to.equal('Open file');
  });

  it('Download XML is disabled when no document is loaded', async () => {
    const el = await fixture(html`<app-toolbar></app-toolbar>`);
    await el.updateComplete;
    const dl = [...el.shadowRoot.querySelectorAll('.bar > button')]
      .find((b) => b.textContent.trim() === 'Download XML');
    expect(dl.disabled).to.equal(true);
  });

  it('Download XML enables once a document is loaded', async () => {
    store.setState({ document: {}, profile: apcMini, detectedProfiles: [apcMini] });
    const el = await fixture(html`<app-toolbar></app-toolbar>`);
    await el.updateComplete;
    const dl = [...el.shadowRoot.querySelectorAll('.bar > button')]
      .find((b) => b.textContent.trim() === 'Download XML');
    expect(dl.disabled).to.equal(false);
  });

  it('hides device label and filename until a document is loaded', async () => {
    const el = await fixture(html`<app-toolbar></app-toolbar>`);
    await el.updateComplete;
    expect(el.shadowRoot.querySelector('.device')).to.equal(null);
    expect(el.shadowRoot.querySelector('.filename').textContent.trim()).to.equal('');
  });

  it('always shows a "?" help button (even without a loaded document)', async () => {
    const el = await fixture(html`<app-toolbar></app-toolbar>`);
    await el.updateComplete;
    const help = el.shadowRoot.querySelector('.bar button.help');
    expect(help).to.exist;
    expect(help.textContent.trim()).to.equal('?');
  });

  it('clicking the "?" button opens the help dialog', async () => {
    const el = await fixture(html`<app-toolbar></app-toolbar>`);
    await el.updateComplete;
    el.shadowRoot.querySelector('.bar button.help').click();
    await el.updateComplete;
    const dlg = el.shadowRoot.querySelector('help-dialog').shadowRoot.querySelector('dialog');
    expect(dlg.open).to.equal(true);
  });

  it('renders a hidden file input that the Open file button triggers', async () => {
    const el = await fixture(html`<app-toolbar></app-toolbar>`);
    await el.updateComplete;
    const input = el.shadowRoot.querySelector('input[type=file]');
    expect(input).to.exist;
    expect(input.accept).to.contain('xml');
  });
});
