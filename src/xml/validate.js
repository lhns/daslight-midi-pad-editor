// Inspect SETTINGS/@DEVICEOUT. The expected value depends on each row's
// input port (in EVENT DATA), because a single XML can mix multiple devices
// (e.g. an LP MK3 row and an APC mini row in one file). Anything that's not
// already one of the registered profiles' deviceOut, but is in any profile's
// altDeviceOut (e.g. "All"), is flagged as fixable; the fix replaces it with
// the deviceOut of the profile whose eventPort matches that row.

export function validate(doc, profiles) {
  const list = Array.isArray(profiles) ? profiles : [profiles];
  const validValues = new Set(list.map((p) => p.deviceOut));
  const offenders = [];

  for (const settings of doc.querySelectorAll('SETTINGS')) {
    const v = settings.getAttribute('DEVICEOUT');
    if (v == null) continue;
    if (validValues.has(v)) continue;

    // Could any registered profile claim this row?
    const altClaim = list.find((p) => p.altDeviceOut?.includes(v));
    if (!altClaim) {
      offenders.push({ settingsEl: settings, value: v, fixable: false, suggestedDeviceOut: null });
      continue;
    }

    // Pick the right deviceOut for this row from its EVENT DATA port suffix.
    const shortcut = settings.closest('SHORTCUT');
    const eventData = shortcut?.querySelector('EVENT')?.getAttribute('DATA') ?? '';
    const portMatch = /:([^:]+)$/.exec(eventData);
    const port = portMatch?.[1] ?? null;
    const target = port ? list.find((p) => p.eventPort === port) : null;

    offenders.push({
      settingsEl: settings,
      value: v,
      fixable: !!target,
      suggestedDeviceOut: target?.deviceOut ?? null,
    });
  }

  return { ok: offenders.length === 0, offenders };
}

export function applyFix(result) {
  let count = 0;
  for (const o of result.offenders) {
    if (!o.fixable || !o.suggestedDeviceOut) continue;
    o.settingsEl.setAttribute('DEVICEOUT', o.suggestedDeviceOut);
    count++;
  }
  return count;
}
