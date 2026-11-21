const KEY = 'leonida-platinum-v1';
const empty = () => ({ earned: {}, counts: {}, settings: { spoilers: false, hideEarned: false } });

export function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '{}');
    return {
      ...empty(), ...parsed,
      earned: parsed.earned && typeof parsed.earned === 'object' ? parsed.earned : {},
      counts: parsed.counts && typeof parsed.counts === 'object' ? parsed.counts : {},
      settings: { ...empty().settings, ...(parsed.settings || {}) },
    };
  } catch { return empty(); }
}

export function save(state) { localStorage.setItem(KEY, JSON.stringify(state)); return state; }
export function toggleEarned(state, name) { state.earned[name] = !state.earned[name]; return save(state); }
export function setCount(state, name, count) { state.counts[name] = Math.max(0, Math.floor(Number(count) || 0)); return save(state); }
export function earnedCount(state) { return Object.values(state.earned).filter(Boolean).length; }

export function exportJSON(state) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
  link.download = 'leonida-platinum-progress-' + new Date().toISOString().slice(0, 10) + '.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

export function importJSON(text, names) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object' || !parsed.earned || !parsed.counts || typeof parsed.earned !== 'object' || typeof parsed.counts !== 'object') {
    throw new Error('This file is not a Leonida Platinum progress file.');
  }
  const validNames = new Set(names);
  const earned = Object.fromEntries(Object.entries(parsed.earned).filter(([name, value]) => validNames.has(name) && value === true));
  const counts = Object.fromEntries(Object.entries(parsed.counts).filter(([name, value]) => validNames.has(name) && Number.isFinite(Number(value))).map(([name, value]) => [name, Math.max(0, Math.floor(Number(value)))]));
  return save({ earned, counts, settings: { ...empty().settings, ...(parsed.settings || {}) } });
}
