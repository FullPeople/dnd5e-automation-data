type Raw = Record<string, any>;
const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
// Mechanism-free inventory adaptation of DND-card-web src/data/adapt.ts, 80c94e0.
export function inheritSubrace(raw: Raw, races: Raw[]): Raw {
  const parent = races.find(r => [r.name, r.ENG_name].includes(raw.raceName) && r.source === (raw.raceSource || 'PHB'));
  if (!parent) return { ...raw, _unresolvedParent: true };
  const merged: Raw = { ...parent, ...raw, _parentName: parent.name, _parentSource: parent.source, _subraceName: raw.name };
  merged.name = raw.name ? `${parent.name}（${raw.name}）` : parent.name;
  merged.ENG_name = raw.name ? `${parent.ENG_name || parent.name} (${raw.ENG_name || raw.name})` : parent.ENG_name || parent.name;
  const parentEntries = structuredClone(parent.entries || []);
  for (const entry of raw.entries || []) {
    const overwrite = typeof entry === 'object' && entry?.data?.overwrite;
    const index = overwrite ? parentEntries.findIndex((e: Raw) => e.name === overwrite || e.ENG_name === overwrite) : -1;
    if (index >= 0) parentEntries[index] = entry; else parentEntries.push(entry);
  }
  merged.entries = parentEntries;
  if (raw.overwrite?.ability) merged.ability = raw.ability;
  else if (parent.ability?.length === 1 && raw.ability?.length === 1) {
    const a = { ...parent.ability[0], ...raw.ability[0] };
    for (const key of ABILITIES) if (typeof parent.ability[0][key] === 'number' || typeof raw.ability[0][key] === 'number') a[key] = (parent.ability[0][key] || 0) + (raw.ability[0][key] || 0);
    merged.ability = [a];
  } else if (raw.ability && parent.ability) merged._unresolvedParent = true;
  for (const key of ['skillProficiencies', 'toolProficiencies', 'languageProficiencies', 'weaponProficiencies', 'armorProficiencies', 'additionalSpells']) {
    if (!raw.overwrite?.[key]) merged[key] = [...(parent[key] || []), ...(raw[key] || [])];
  }
  return merged;
}
