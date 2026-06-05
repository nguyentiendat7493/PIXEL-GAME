import { achievementSystem } from './achievementSystem.js';
import { animalSystem } from './animalSystem.js';
import { areaSystem } from './areaSystem.js';
import { bossSystem } from './bossSystem.js';
import { characterSystem } from './characterSystem.js';
import { childrenSystem } from './childrenSystem.js';
import { combatSystem } from './combatSystem.js';
import { craftingSystem } from './craftingSystem.js';
import { cropSystem } from './cropSystem.js';
import { economySystem } from './economySystem.js';
import { endgameSystem } from './endgameSystem.js';
import { farmSystem } from './farmSystem.js';
import { festivalSystem } from './festivalSystem.js';
import { fishingSystem } from './fishingSystem.js';
import { friendshipSystem } from './friendshipSystem.js';
import { grandfatherJournalSystem } from './grandfatherJournalSystem.js';
import { houseSystem } from './houseSystem.js';
import { miningSystem } from './miningSystem.js';
import { mountSystem } from './mountSystem.js';
import { museumSystem } from './museumSystem.js';
import { npcSystem } from './npcSystem.js';
import { petSystem } from './petSystem.js';
import { questSystem } from './questSystem.js';
import { romanceSystem } from './romanceSystem.js';
import { seasonSystem } from './seasonSystem.js';
import { weatherSystem } from './weatherSystem.js';

export const gameSystems = [
  characterSystem,
  farmSystem,
  cropSystem,
  animalSystem,
  mountSystem,
  fishingSystem,
  miningSystem,
  combatSystem,
  bossSystem,
  npcSystem,
  friendshipSystem,
  romanceSystem,
  childrenSystem,
  questSystem,
  grandfatherJournalSystem,
  festivalSystem,
  weatherSystem,
  seasonSystem,
  craftingSystem,
  houseSystem,
  museumSystem,
  petSystem,
  areaSystem,
  economySystem,
  achievementSystem,
  endgameSystem,
];

export const gameSystemById = Object.fromEntries(gameSystems.map((system) => [system.id, system]));
