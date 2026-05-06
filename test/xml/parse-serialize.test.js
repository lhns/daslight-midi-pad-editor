import { expect } from '@open-wc/testing';
import { parseXml, buildModel } from '../../src/xml/parse.js';
import { applyModelToDom, serialize } from '../../src/xml/serialize.js';
import { validate, applyFix } from '../../src/xml/validate.js';
import { detectProfile, detectAllProfiles, getProfile, PROFILES } from '../../src/devices/index.js';

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

describe('Multi-device XML', () => {
  it('buildModel(doc, lpMk3) only includes LP MK3 SHORTCUTs from a mixed file', async () => {
    const text = await loadText('/docs/midi-all-with-faders.xml');
    const doc = parseXml(text);
    const lp = getProfile('launchpad-mini-mk3');
    const model = buildModel(doc, lp);
    const bound = [...model.buttons.values()].filter((b) => b.bound);
    expect(bound.length).to.equal(36); // 36 LP MK3 entries in the fixture
  });

  it('buildModel(doc, apcMini) only includes APC mini buttons (faders are excluded)', async () => {
    const text = await loadText('/docs/midi-all-with-faders.xml');
    const doc = parseXml(text);
    const apc = getProfile('akai-apc-mini');
    const model = buildModel(doc, apc);
    const bound = [...model.buttons.values()].filter((b) => b.bound);
    // 90 APC mini entries - 9 faders (CC 176 notes 48-56) = 81 buttons in the
    // file, but Daslight's export here is missing note 6 (a known data gap),
    // so 80 layout buttons bind. The unbound one is row 2, col 7.
    expect(bound.length).to.equal(80);
    const unbound = [...model.buttons.values()].filter((b) => !b.bound);
    expect(unbound.length).to.equal(1);
    expect(unbound[0].addr.id).to.equal('2,7');
  });

  it('faders are preserved verbatim through parse → no-op edit → serialize', async () => {
    const text = await loadText('/docs/midi-all-with-faders.xml');
    const doc = parseXml(text);
    const captureFaders = (d) => [...d.querySelectorAll('SHORTCUT')]
      .filter((sc) => {
        const data = sc.querySelector('EVENT')?.getAttribute('DATA') ?? '';
        return /^176:0:(48|49|50|51|52|53|54|55|56):/.test(data) && /APC MINI$/.test(data);
      })
      .map((sc) => ({
        event: sc.querySelector('EVENT').getAttribute('DATA'),
        target: sc.querySelector('ACTION').getAttribute('TARGET'),
        targetIndex: sc.querySelector('ACTION').getAttribute('TARGETINDEX'),
        deviceOut: sc.querySelector('SETTINGS').getAttribute('DEVICEOUT'),
      }));
    const before = captureFaders(doc);
    expect(before.length).to.equal(9);

    // Build models for both detected devices, applyModel without edits.
    for (const p of detectAllProfiles(doc)) {
      const m = buildModel(doc, p);
      applyModelToDom(m, p);
    }
    const reparsed = parseXml(serialize(doc));
    const after = captureFaders(reparsed);
    expect(after).to.deep.equal(before);
  });

  it('per-row DEVICEOUT fix targets each row\'s input port', async () => {
    // Synthesize a tiny mixed XML with two SHORTCUTs both DEVICEOUT="All".
    const text = `<SHORTCUTS>
<SHORTCUT TYPE="1"><EVENT DATA="144:0:81:127:MIDIIN2 (LPMiniMK3 MIDI)"/><ACTION TYPE="107" TARGET="x" TARGETINDEX="1"/><SETTINGS DEVICEOUT="All" OUT="144:0:81:5:MIDIIN2 (LPMiniMK3 MIDI)" OUT1="144:0:81:5:MIDIIN2 (LPMiniMK3 MIDI)" OUT2="144:0:81:5:MIDIIN2 (LPMiniMK3 MIDI)"/></SHORTCUT>
<SHORTCUT TYPE="1"><EVENT DATA="144:0:0:127:APC MINI"/><ACTION TYPE="107" TARGET="y" TARGETINDEX="2"/><SETTINGS DEVICEOUT="All" OUT="144:0:0:0:APC MINI" OUT1="144:0:0:1:APC MINI" OUT2="144:0:0:2:APC MINI"/></SHORTCUT>
</SHORTCUTS>`;
    const doc = parseXml(text);
    const v = validate(doc, PROFILES);
    expect(v.offenders.length).to.equal(2);
    expect(v.offenders.every((o) => o.fixable)).to.equal(true);
    const n = applyFix(v);
    expect(n).to.equal(2);
    const settings = doc.querySelectorAll('SETTINGS');
    expect(settings[0].getAttribute('DEVICEOUT')).to.equal('MIDIOUT2 (LPMiniMK3 MIDI)');
    expect(settings[1].getAttribute('DEVICEOUT')).to.equal('APC MINI');
  });

  it('validate against PROFILES recognizes already-correct DEVICEOUTs of either device', async () => {
    const text = await loadText('/docs/midi-all-with-faders.xml');
    const doc = parseXml(text);
    const v = validate(doc, PROFILES);
    expect(v.ok).to.equal(true); // file already has correct per-row DEVICEOUTs
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
