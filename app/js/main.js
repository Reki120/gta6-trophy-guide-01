import { data, roadmap, tips } from './data.js';
import { load, save, toggleEarned, setCount, exportJSON, importJSON, earnedCount } from './store.js';
import { byKind, byGrade, bySearch } from './filters.js';
import { checklistView, roadmapView, missablesView, aboutView, tipsView } from './views.js';

const state = load();
let route = 'checklist';
let selectedId = 40;
let kind = 'all';
let searchText = '';
let grade = 'all';
const view = document.getElementById('view');
const controls = document.getElementById('controls');
const kindBar = document.getElementById('kind-filters');
const errorBox = document.getElementById('import-status');
const filterKinds = [['all','All'],['story','Story'],['missable','Missable'],['collectibles','Collectibles'],['activities','Activities'],['online','Online']];

function updateHeader() {
  const total = earnedCount(state);
  document.getElementById('earned-total').textContent = `${total} of ${data.trophies.length} earned`;
  document.getElementById('percent').textContent = `${Math.round(total / data.trophies.length * 100)}%`;
  document.getElementById('header-progress').style.width = `${total / data.trophies.length * 100}%`;
  document.getElementById('header-progress').setAttribute('aria-valuenow', String(total));
}

function createFilterChips() {
  kindBar.replaceChildren();
  for (const [value, label] of filterKinds) {
    const button = document.createElement('button'); button.type = 'button'; button.className = `chip${kind === value ? ' active' : ''}`; button.textContent = label;
    button.setAttribute('aria-pressed', String(kind === value));
    button.addEventListener('click', () => { kind = value; render(); }); kindBar.append(button);
  }
}

function toggle(trophy) { toggleEarned(state, trophy.name); render(); }
function count(trophy, delta) { setCount(state, trophy.name, (state.counts[trophy.name] || 0) + delta); render(); }
function select(id) {
  selectedId = id;
  if (route === 'roadmap') { location.hash = '#checklist'; return; }
  render();
}

function setRouteFromHash() {
  const candidate = location.hash.slice(1);
  route = ['checklist','roadmap','missables','about'].includes(candidate) ? candidate : 'checklist';
  if (route === 'missables' && !data.trophies.find(t => t.id === selectedId)?.missable) selectedId = 48;
  if (route === 'checklist' && !selectedId) selectedId = 40;
  render();
}

function render() {
  updateHeader();
  document.querySelectorAll('[data-route]').forEach(link => {
    const active = link.dataset.route === route; link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');
  });
  const isChecklist = route === 'checklist';
  controls.classList.toggle('controls-secondary', !isChecklist);
  document.getElementById('checklist-controls').hidden = !isChecklist;
  if (route === 'roadmap') { roadmapView(view, roadmap, data.trophies, state, select); return; }
  if (route === 'missables') { missablesView(view, data.trophies, state, selectedId, select, toggle, count); return; }
  if (route === 'about') { aboutView(view); return; }
  createFilterChips();
  let filtered = byKind(data.trophies, kind);
  if (kind === 'online') filtered = [];
  filtered = byGrade(filtered, grade); filtered = bySearch(filtered, searchText);
  if (state.settings.hideEarned) filtered = filtered.filter(trophy => !state.earned[trophy.name]);
  state.onlineEmpty = kind === 'online';
  checklistView(view, filtered, roadmap, state, selectedId, select, toggle, count);
}

document.getElementById('search').addEventListener('input', event => { searchText = event.target.value; render(); });
document.getElementById('grade').addEventListener('change', event => { grade = event.target.value; render(); });
document.getElementById('spoilers').checked = Boolean(state.settings.spoilers);
document.getElementById('spoilers').addEventListener('change', event => { state.settings.spoilers = event.target.checked; save(state); render(); });
document.getElementById('hide-earned').checked = Boolean(state.settings.hideEarned);
document.getElementById('hide-earned').addEventListener('change', event => { state.settings.hideEarned = event.target.checked; save(state); render(); });
document.getElementById('export').addEventListener('click', () => exportJSON(state));
document.getElementById('import').addEventListener('change', async event => {
  const file = event.target.files?.[0]; if (!file) return;
  try {
    const imported = importJSON(await file.text(), data.trophies.map(trophy => trophy.name));
    Object.assign(state, imported);
    document.getElementById('spoilers').checked = state.settings.spoilers;
    document.getElementById('hide-earned').checked = state.settings.hideEarned;
    errorBox.textContent = 'Progress imported.';
    render();
  } catch { errorBox.textContent = 'Could not import that file. Choose a valid Leonida Platinum export.'; }
  event.target.value = '';
});
window.addEventListener('hashchange', setRouteFromHash);
tipsView(document.getElementById('tips'), tips);
setRouteFromHash();
