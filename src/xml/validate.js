// Inspect SETTINGS/@DEVICEOUT against the active profile. Anything that's not
// the expected value but is in altDeviceOut (e.g. "All") is flagged as fixable.

export function validate(doc, profile) {
  const offenders = [];
  for (const settings of doc.querySelectorAll('SETTINGS')) {
    const v = settings.getAttribute('DEVICEOUT');
    if (v == null) continue;
    if (v === profile.deviceOut) continue;
    const fixable = profile.altDeviceOut.includes(v);
    offenders.push({ settingsEl: settings, value: v, fixable });
  }
  return { ok: offenders.length === 0, offenders };
}

export function applyFix(result, profile) {
  let count = 0;
  for (const o of result.offenders) {
    if (!o.fixable) continue;
    o.settingsEl.setAttribute('DEVICEOUT', profile.deviceOut);
    count++;
  }
  return count;
}
