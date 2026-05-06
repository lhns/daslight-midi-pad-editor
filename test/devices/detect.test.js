import { expect } from '@open-wc/testing';
import { detectProfile, detectAllProfiles } from '../../src/devices/index.js';

async function loadXml(path) {
  const res = await fetch(path);
  const text = await res.text();
  return new DOMParser().parseFromString(text, 'application/xml');
}

describe('detectProfile', () => {
  it('detects Launchpad Mini MK3 from example-input.xml', async () => {
    const doc = await loadXml('/docs/example-input.xml');
    const p = detectProfile(doc);
    expect(p?.id).to.equal('launchpad-mini-mk3');
  });

  it('detects Launchpad Mini MK3 from every-button.xml', async () => {
    const doc = await loadXml('/docs/every-button.xml');
    const p = detectProfile(doc);
    expect(p?.id).to.equal('launchpad-mini-mk3');
  });

  it('detects Akai APC mini from every-button-AkaiApcMini.xml', async () => {
    const doc = await loadXml('/docs/every-button-AkaiApcMini.xml');
    const p = detectProfile(doc);
    expect(p?.id).to.equal('akai-apc-mini');
  });

  it('returns null for unrelated XML', () => {
    const doc = new DOMParser().parseFromString('<root><foo/></root>', 'application/xml');
    expect(detectProfile(doc)).to.equal(null);
  });
});

describe('detectAllProfiles', () => {
  it('returns both profiles for a mixed-device file', async () => {
    const doc = await loadXml('/docs/midi-all-with-faders.xml');
    const ps = detectAllProfiles(doc);
    expect(ps.map((p) => p.id).sort()).to.deep.equal(['akai-apc-mini', 'launchpad-mini-mk3']);
  });

  it('returns just one profile when only one device is present', async () => {
    const doc = await loadXml('/docs/every-button.xml');
    const ps = detectAllProfiles(doc);
    expect(ps.map((p) => p.id)).to.deep.equal(['launchpad-mini-mk3']);
  });

  it('returns an empty list for unrelated XML', () => {
    const doc = new DOMParser().parseFromString('<root><foo/></root>', 'application/xml');
    expect(detectAllProfiles(doc)).to.deep.equal([]);
  });
});
