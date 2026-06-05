import { createNpcState } from './npcSystem.js';
import { createInitialStoryState } from './storyProgress.js';
import { createWorldState } from './worldSystem.js';
import { createQuestState } from './questSystem.js';
import { createMapState } from './mapSystem.js';
import { createSkillExpState } from './skillSystem.js';
import { createDecorationState } from './decorationSystem.js';

export function createInitialGameState() {
  return {
    player: {
      name: 'Farmer',
      energy: 100,
      money: 500,
      day: 1,
      season: 'spring',
      skills: {
        farming: 1,
        mining: 1,
        fishing: 1,
        combat: 1,
        foraging: 1,
        crafting: 1,
      },
      skillExp: createSkillExpState(),
      tools: {
        hoe: 1,
        wateringCan: 1,
        axe: 1,
        pickaxe: 1,
        fishingRod: 1,
        sickle: 1,
      },
    },
    inventory: {
      seed_white: 4,
      seed_green: 2,
      seed_blue: 1,
      crop_white: 0,
      crop_green: 0,
      crop_blue: 0,
      gift_rose: 2,
      gift_iron_ore: 2,
      gift_book: 1,
      gift_candy: 2,
      gift_mushroom: 1,
    },
    chest: {
      seed_white: 0,
      seed_green: 0,
      seed_blue: 0,
      crop_white: 0,
      crop_green: 0,
      crop_blue: 0,
      gift_rose: 0,
      gift_iron_ore: 0,
      gift_book: 0,
      gift_candy: 0,
      gift_mushroom: 0,
    },
    story: createInitialStoryState(),
    npcs: createNpcState(),
    world: createWorldState(),
    quests: createQuestState(),
    maps: createMapState(),
    decorations: createDecorationState(),
  };
}
