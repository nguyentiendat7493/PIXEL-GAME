export function giveGiftToNpc(npcState, npc, itemName) {
  const state = npcState[npc.id];
  if (!state) return null;

  let delta = 1;
  let reaction = 'Cam on nhe.';
  if (npc.lovedGifts.includes(itemName)) {
    delta = 2;
    reaction = 'O! Toi rat thich mon nay!';
  } else if (npc.hatedGifts.includes(itemName)) {
    delta = -2;
    reaction = 'O... thoi duoc.';
  }

  state.friendship = Math.min(10, Math.max(0, state.friendship + delta));
  return {
    delta,
    reaction,
    friendship: state.friendship,
  };
}
