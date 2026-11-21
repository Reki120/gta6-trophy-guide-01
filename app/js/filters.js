export const byKind = (trophies, kind) => kind === 'all' ? trophies : trophies.filter(trophy => kind === 'missable' ? trophy.missable : trophy.kind === kind);
export const byGrade = (trophies, grade) => grade === 'all' ? trophies : trophies.filter(trophy => trophy.grade === grade);
export const bySearch = (trophies, query) => {
  const term = query.trim().toLocaleLowerCase();
  return term ? trophies.filter(trophy => `${trophy.name} ${trophy.description}`.toLocaleLowerCase().includes(term)) : trophies;
};
export function display(trophy, state) {
  if (state.settings.spoilers && trophy.kind === 'story' && !state.earned[trophy.name]) {
    return { ...trophy, name: 'Hidden story trophy', description: 'Story trophy — its name and description stay hidden until you earn it. (Spoiler setting is on.)' };
  }
  return trophy;
}
