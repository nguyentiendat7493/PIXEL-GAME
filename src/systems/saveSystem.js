const SAVE_KEY = 'langHoaGio.save.v1';

export function saveGame(state) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(SAVE_KEY);
    return null;
  }
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}
