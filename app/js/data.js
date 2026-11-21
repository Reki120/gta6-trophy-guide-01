export const data = await fetch('./data/trophies.json').then(response => {
  if (!response.ok) throw new Error('Could not load trophy data.');
  return response.json();
});

export const roadmap = await fetch('./data/roadmap.json').then(response => {
  if (!response.ok) throw new Error('Could not load roadmap data.');
  return response.json();
});

export const tips = await fetch('./data/tips.json').then(response => {
  if (!response.ok) throw new Error('Could not load tips data.');
  return response.json();
});
