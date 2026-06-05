import { greenHollowNpcs } from '../data/npcs/index.js';

export function createNpcState() {
  return Object.fromEntries(
    greenHollowNpcs.map((npc) => [
      npc.id,
      {
        friendship: 0,
        talks: 0,
      },
    ]),
  );
}

export function getNpcById(npcId) {
  return greenHollowNpcs.find((npc) => npc.id === npcId) ?? null;
}

export function talkToNpc(npcState, npcId) {
  const npc = getNpcById(npcId);
  const state = npcState[npcId];
  if (!npc || !state) return null;

  const dialogue = npc.dialogue[state.talks % npc.dialogue.length];
  state.talks += 1;
  state.friendship = Math.min(10, state.friendship + 0.25);

  return {
    npc,
    dialogue,
    friendship: state.friendship,
  };
}
