import { display } from './filters.js';

const node = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined && text !== null) element.textContent = String(text);
  return element;
};
const medal = trophy => { const dot = node('i', `dot ${trophy.grade}`); dot.setAttribute('aria-label', `${trophy.grade} trophy`); return dot; };
const chip = (label, className = 'kind-chip') => node('span', className, label);
const stepper = (trophy, state, onCount, compact = false) => {
  const wrap = node('div', compact ? 'stepper compact-stepper' : 'stepper');
  const down = node('button', '', '−'); down.type = 'button'; down.setAttribute('aria-label', `Decrease ${trophy.name} progress`);
  const count = node('span', 'count', `${state.counts[trophy.name] || 0} / ${trophy.target}`);
  const up = node('button', '', '+'); up.type = 'button'; up.setAttribute('aria-label', `Increase ${trophy.name} progress`);
  down.addEventListener('click', event => { event.stopPropagation(); onCount(trophy, -1); });
  up.addEventListener('click', event => { event.stopPropagation(); onCount(trophy, 1); });
  wrap.append(down, count, up); return wrap;
};

function detailPane(trophy, state, onToggle, onCount) {
  const pane = node('aside', 'detail');
  if (!trophy) { pane.append(node('p', 'eyebrow', 'TROPHY NOTES'), node('h2', '', 'Choose a trophy'), node('p', 'official', 'Select a row to see its guide, practical steps, and sources.')); return pane; }
  const shown = display(trophy, state);
  const top = node('div', 'detail-kickers'); top.append(medal(trophy), chip(trophy.kind), chip(trophy.grade, 'grade-chip'));
  if (trophy.missable) top.append(chip('missable', 'flag-chip'));
  if (trophy.hidden) top.append(chip('hidden', 'flag-chip'));
  pane.append(top, node('p', 'eyebrow detail-eyebrow', `TROPHY ${String(trophy.id).padStart(2, '0')} · STAGE ${trophy.stage}`), node('h2', '', shown.name), node('p', 'official', shown.description));
  pane.append(node('h3', '', 'Guide'), node('p', 'guide-copy', trophy.guide));
  if (trophy.missable) {
    const warning = node('div', 'warning');
    warning.append(node('strong', '', 'Caution from the official wording. '), document.createTextNode('The game is new; this flag is not a confirmed lockout.'));
    pane.append(warning);
  }
  pane.append(node('h3', '', 'Suggested order'));
  const steps = node('ol', 'detail-steps'); for (const text of trophy.steps) steps.append(node('li', '', text)); pane.append(steps);
  if (trophy.target !== null) pane.append(node('h3', 'counter-heading', 'Progress'), stepper(trophy, state, onCount));
  const earn = node('label', 'toggle detail-earned');
  const checkbox = node('input'); checkbox.type = 'checkbox'; checkbox.checked = Boolean(state.earned[trophy.name]); checkbox.addEventListener('change', () => onToggle(trophy));
  earn.append(checkbox, node('span', 'switch'), node('span', '', 'Mark earned')); pane.append(earn);
  pane.append(node('h3', 'sources-heading', 'Sources'));
  const sources = node('ul', 'sources');
  for (const source of trophy.sources) { const item = node('li'); const link = node('a', '', source.label); link.href = source.url; link.target = '_blank'; link.rel = 'noreferrer'; item.append(link); sources.append(item); }
  pane.append(sources); return pane;
}

export function checklistView(root, trophies, roadmap, state, selectedId, onSelect, onToggle, onCount) {
  const shell = node('div', 'split'); const list = node('div', 'list');
  let shownCount = 0;
  for (const stage of roadmap.stages) {
    const stageTrophies = trophies.filter(trophy => stage.trophyIds.includes(trophy.id));
    if (!stageTrophies.length) continue;
    const group = node('section', 'stage-group');
    const heading = node('div', 'stage-heading');
    heading.append(node('h2', '', `Stage ${stage.n} · ${stage.title}`), node('span', '', `${stageTrophies.filter(t => state.earned[t.name]).length} / ${stageTrophies.length}`)); group.append(heading);
    const rows = node('div', 'rows');
    for (const trophy of stageTrophies) {
      const shown = display(trophy, state); const row = node('article', `trophy-row${selectedId === trophy.id ? ' selected' : ''}`); row.tabIndex = 0; row.setAttribute('role', 'button'); row.setAttribute('aria-label', `${shown.name}: open trophy details`);
      row.addEventListener('click', () => onSelect(trophy.id)); row.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(trophy.id); } });
      const earned = node('input'); earned.type = 'checkbox'; earned.checked = Boolean(state.earned[trophy.name]); earned.setAttribute('aria-label', `Mark ${shown.name} earned`); earned.addEventListener('click', event => event.stopPropagation()); earned.addEventListener('change', () => onToggle(trophy));
      const copy = node('div', 'row-copy'); copy.append(node('div', 'row-title', shown.name), node('div', 'row-desc', shown.description));
      const meta = node('div', 'row-meta'); meta.append(chip(trophy.grade, 'grade-chip'), chip(trophy.kind));
      if (trophy.missable) meta.append(chip('missable', 'flag-chip')); if (trophy.hidden) meta.append(chip('hidden', 'flag-chip'));
      if (trophy.target !== null) meta.append(stepper(trophy, state, onCount, true));
      row.append(earned, medal(trophy), copy, meta); rows.append(row); shownCount++;
    }
    group.append(rows); list.append(group);
  }
  if (!shownCount) list.append(node('div', 'empty', state.onlineEmpty ? 'The official list has no online trophies.' : 'No trophies match these filters.'));
  shell.append(list, detailPane(trophies.find(trophy => trophy.id === selectedId), state, onToggle, onCount)); root.replaceChildren(shell);
}

export function roadmapView(root, roadmap, trophies, state, onSelect) {
  const grid = node('div', 'roadmap');
  for (const stage of roadmap.stages) {
    const stageTrophies = trophies.filter(trophy => stage.trophyIds.includes(trophy.id));
    const card = node('article', 'stage-card'); const heading = node('div', 'stage-card-head');
    heading.append(node('p', 'eyebrow', `ROADMAP / ${String(stage.n).padStart(2, '0')}`), node('strong', 'stage-progress', `${stageTrophies.filter(t => state.earned[t.name]).length} / ${stageTrophies.length} earned`));
    card.append(heading, node('h2', '', stage.title), node('p', 'stage-summary', stage.summary)); const rows = node('div', 'compact-list');
    for (const trophy of stageTrophies) {
      const shown = display(trophy, state);
      const row = node('button', `compact${state.earned[trophy.name] ? ' done' : ''}`, ''); row.type = 'button';
      const label = node('span', 'compact-name'); label.append(medal(trophy), document.createTextNode(shown.name));
      row.append(label, node('span', 'compact-mark', state.earned[trophy.name] ? '✓' : '→')); row.addEventListener('click', () => onSelect(trophy.id)); rows.append(row);
    }
    card.append(rows); grid.append(card);
  }
  root.replaceChildren(grid);
}

export function missablesView(root, trophies, state, selectedId, onSelect, onToggle, onCount) {
  const shell = node('div', 'missables-layout'); const content = node('div', 'missables-content');
  content.append(node('p', 'eyebrow', 'KEEP AN EYE OUT'), node('h2', '', 'Three flagged opportunities'), node('p', 'missables-intro', 'These flags come from the official trophy descriptions. They mark wording that could suggest a time-sensitive chance, so treat them as planning cautions—not confirmed missables or facts about how the game works.'));
  const rows = node('div', 'rows missable-rows');
  for (const trophy of trophies.filter(item => item.missable)) {
    const row = node('button', `trophy-row missable-row${selectedId === trophy.id ? ' selected' : ''}`, ''); row.type = 'button'; row.addEventListener('click', () => onSelect(trophy.id));
    const copy = node('div', 'row-copy'); copy.append(node('div', 'row-title', trophy.name), node('div', 'row-desc', trophy.description));
    row.append(medal(trophy), copy, chip('missable', 'flag-chip')); rows.append(row);
  }
  content.append(rows); shell.append(content, detailPane(trophies.find(trophy => trophy.id === selectedId), state, onToggle, onCount)); root.replaceChildren(shell);
}

export function aboutView(root) {
  const article = node('article', 'about-page');
  article.append(node('p', 'eyebrow', 'FIELD NOTES / ABOUT'), node('h2', '', 'A guide that keeps its receipts.'), node('p', 'about-lede', 'Leonida Platinum is an offline GTA VI trophy guide and progress tracker for all 55 official PlayStation 5 trophies. Track checklists and counters, plan a seven-stage route, review flagged opportunities, and export or import your progress.'));
  const facts = node('div', 'about-facts');
  for (const [number, label] of [['55','official trophies'],['1 / 2 / 6 / 46','platinum · gold · silver · bronze'],['28','hidden entries']]) { const fact = node('div', 'fact'); fact.append(node('strong', '', number), node('span', '', label)); facts.append(fact); }
  article.append(facts, node('h3', '', 'Sources & method'), node('p', '', 'Names, descriptions, grades, and hidden status follow the published trophy list. PSNProfiles supplies the progress targets shown for counted objectives. The guide prose is our own advice based on the official descriptions; it has not yet been checked in the game, and it avoids presenting unnamed places or mechanics as fact.'));
  const sources = node('ul', 'about-sources');
  for (const [label, url] of [['Official trophy list — Exophase','https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/'],['PSNProfiles — GTA VI trophies','https://psnprofiles.com/trophies/43531-grand-theft-auto-vi']]) { const li = node('li'); const a = node('a','',label); a.href = url; a.target = '_blank'; a.rel = 'noreferrer'; li.append(a); sources.append(li); }
  article.append(sources, node('h3', '', 'Offline by design'), node('p', '', 'All app files are local: there are no external fonts, images, or runtime data requests. The visual identity is original and uses no Rockstar artwork. Your progress stays in this browser unless you export it.'));
  root.replaceChildren(article);
}
