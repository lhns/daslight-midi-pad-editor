import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/help-dialog.js';

describe('<help-dialog>', () => {
  it('is closed by default', async () => {
    const el = await fixture(html`<help-dialog></help-dialog>`);
    const dlg = el.shadowRoot.querySelector('dialog');
    expect(dlg).to.exist;
    expect(dlg.open).to.equal(false);
  });

  it('opens via .open() and closes via the close button', async () => {
    const el = await fixture(html`<help-dialog></help-dialog>`);
    el.open();
    await el.updateComplete;
    const dlg = el.shadowRoot.querySelector('dialog');
    expect(dlg.open).to.equal(true);
    el.shadowRoot.querySelector('.close').click();
    await el.updateComplete;
    expect(dlg.open).to.equal(false);
  });

  it('a click whose target is the dialog itself (backdrop) closes it', async () => {
    const el = await fixture(html`<help-dialog></help-dialog>`);
    el.open();
    await el.updateComplete;
    const dlg = el.shadowRoot.querySelector('dialog');
    expect(dlg.open).to.equal(true);
    // dispatchEvent with the dialog as the target — emulates the backdrop click.
    dlg.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await el.updateComplete;
    expect(dlg.open).to.equal(false);
  });

  it('a click on inner content does not close the dialog', async () => {
    const el = await fixture(html`<help-dialog></help-dialog>`);
    el.open();
    await el.updateComplete;
    const dlg = el.shadowRoot.querySelector('dialog');
    const head = el.shadowRoot.querySelector('.head h2');
    head.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await el.updateComplete;
    expect(dlg.open).to.equal(true);
  });

  it('lists every documented shortcut category', async () => {
    const el = await fixture(html`<help-dialog></help-dialog>`);
    el.open();
    await el.updateComplete;
    const text = el.shadowRoot.textContent;
    for (const needle of [
      // section headings
      'Selection on the pad', 'Edit', 'Copy', 'paste', 'History', 'File',
      // shortcut keys
      'Shift', 'Ctrl', 'Z', 'Y', 'C', 'V',
      // semantic descriptions
      'Range-select', 'Undo', 'Redo',
      // file actions
      'Drop XML', 'Open file', 'Download XML',
    ]) {
      expect(text, `missing "${needle}"`).to.contain(needle);
    }
  });

  it('the body scrolls internally without overflowing the dialog (no bottom cut-off)', async () => {
    const wrap = await fixture(html`
      <div style="height: 400px; width: 600px;">
        <help-dialog></help-dialog>
      </div>
    `);
    const el = wrap.querySelector('help-dialog');
    el.open();
    await el.updateComplete;
    await new Promise((r) => requestAnimationFrame(() => r()));
    const dlg = el.shadowRoot.querySelector('dialog');
    const body = el.shadowRoot.querySelector('.body');
    // Dialog is capped (80vh of viewport, here we just want it bounded).
    expect(dlg.clientHeight).to.be.greaterThan(0);
    // Body content overflows → scroll engaged.
    expect(body.scrollHeight).to.be.greaterThan(body.clientHeight);
    // Crucially: body's bottom does not extend past the dialog's bottom edge,
    // so the overflow:hidden on the dialog doesn't clip any content. 2-px
    // tolerance covers sub-pixel rounding plus the 1-px dialog border.
    const bRect = body.getBoundingClientRect();
    const dRect = dlg.getBoundingClientRect();
    expect(bRect.bottom).to.be.at.most(dRect.bottom + 2);
  });

  it('is idempotent — calling open() twice does not throw', async () => {
    const el = await fixture(html`<help-dialog></help-dialog>`);
    el.open();
    el.open(); // would throw on a native dialog without the guard
    await el.updateComplete;
    expect(el.shadowRoot.querySelector('dialog').open).to.equal(true);
  });
});
