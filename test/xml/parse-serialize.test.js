import { expect } from '@open-wc/testing';
import { parseXml, buildModel } from '../../src/xml/parse.js';
import { applyModelToDom, serialize } from '../../src/xml/serialize.js';
import { validate, applyFix } from '../../src/xml/validate.js';
import { detectProfile, getProfile } from '../../src/devices/index.js';

async function loadText(path) {
  const r = await fetch(path);
  return r.text();
}

describe('XML parse + buildModel + serialize', () => {
  it('untouched roundtrip preserves every SHORTCUT structurally', async () => {
    const text = await loadText('/docs/example-input.xml');
    const doc = parseXml(text);
    const profile = detectProfile(doc);
    const model = buildModel(doc, profile);
    applyModelToDom(model, profile); // no edits → no-op
    const out = serialize(doc);
    const reparsed = parseXml(out);
    expectStructuralEqual(reparsed, doc);
  });

  it('decodes every bound button to a valid state id', async () => {
    const text = await loadText('/docs/example-input.xml');
    const doc = parseXml(text);
    const profile = detectProfile(doc);
    const model = buildModel(doc, profile);
    let bound = 0;
    for (const m of model.buttons.values()) {
      if (!m.bound) continue;
      bound++;
      for (const ctrl of ['off', 'on', 'fade']) {
        if (!m.states[ctrl]) continue;
        expect(m.states[ctrl].stateId, `button ${m.addr.id} ${ctrl}`).to.be.a('string');
      }
    }
    expect(bound).to.be.greaterThan(0);
  });

  it('writing a state change re-encodes only that attribute', async () => {
    const text = await loadText('/docs/example-input.xml');
    const doc = parseXml(text);
    const profile = getProfile('launchpad-mini-mk3');
    const model = buildModel(doc, profile);
    // Find any bound button and flip its 'on' state to a known value.
    const target = [...model.buttons.values()].find((b) => b.bound && b.states.on);
    expect(target).to.exist;
    target.states.on = { stateId: 'lp:5:pulse', raw: target.states.on.raw, dirty: true };
    applyModelToDom(model, profile);
    const out = serialize(doc);
    expect(out).to.contain(`144:2:${target.addr.midi.note}:5:`);
  });

  it('roundtrips APC mini xml structurally', async () => {
    const text = await loadText('/docs/every-button-AkaiApcMini.xml');
    const doc = parseXml(text);
    const profile = detectProfile(doc);
    expect(profile.id).to.equal('akai-apc-mini');
    const model = buildModel(doc, profile);
    applyModelToDom(model, profile);
    const reparsed = parseXml(serialize(doc));
    expectStructuralEqual(reparsed, doc);
  });
});

function expectStructuralEqual(a, b) {
  const sa = a.querySelectorAll('SHORTCUT');
  const sb = b.querySelectorAll('SHORTCUT');
  expect(sa.length).to.equal(sb.length);
  for (let i = 0; i < sa.length; i++) {
    const settA = sa[i].querySelector('SETTINGS');
    const settB = sb[i].querySelector('SETTINGS');
    for (const attr of ['DEVICEOUT', 'OUT', 'OUT1', 'OUT2']) {
      expect(settA.getAttribute(attr), `SHORTCUT[${i}] @${attr}`).to.equal(settB.getAttribute(attr));
    }
  }
}

describe('XML validate', () => {
  it('flags DEVICEOUT="All" as fixable', async () => {
    const text = await loadText('/docs/example-input.xml');
    const doc = parseXml(text);
    const profile = getProfile('launchpad-mini-mk3');
    const v = validate(doc, profile);
    expect(v.ok).to.equal(false);
    expect(v.offenders.length).to.be.greaterThan(0);
    expect(v.offenders.every((o) => o.fixable)).to.equal(true);
  });

  it('applyFix replaces all "All" with the expected DEVICEOUT', async () => {
    const text = await loadText('/docs/example-input.xml');
    const doc = parseXml(text);
    const profile = getProfile('launchpad-mini-mk3');
    const v = validate(doc, profile);
    const n = applyFix(v, profile);
    expect(n).to.equal(v.offenders.length);
    const v2 = validate(doc, profile);
    expect(v2.ok).to.equal(true);
  });
});
