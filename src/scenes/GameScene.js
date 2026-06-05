import Phaser from 'phaser';
import {
  advanceRumor,
  findJournalPage,
  getStoryHudLines,
  getStoryPanelLines,
  increaseReputation,
} from '../systems/storyProgress.js';
import { createStoryPanel } from '../ui/storyPanel.js';
import { createSystemCatalogPanel } from '../ui/systemCatalogPanel.js';
import { createQuestJournalPanel } from '../ui/questJournalPanel.js';
import { createMapPanel } from '../ui/mapPanel.js';
import { createWeatherPanel } from '../ui/weatherPanel.js';
import { createToolUpgradePanel } from '../ui/toolUpgradePanel.js';
import { createPlayerProfilePanel } from '../ui/playerProfilePanel.js';
import { createDecorationPanel } from '../ui/decorationPanel.js';
import { greenHollowNpcs } from '../data/npcs/index.js';
import { talkToNpc, getNpcById } from '../systems/npcSystem.js';
import { createInitialGameState } from '../systems/gameState.js';
import { loadGame, saveGame } from '../systems/saveSystem.js';
import { advanceDay, getWeatherInfo } from '../systems/worldSystem.js';
import { getQuestJournalView, getQuestSummary, recordQuestProgress } from '../systems/questSystem.js';
import { giveGiftToNpc } from '../systems/giftSystem.js';
import { getCurrentMap, getUnlockedMaps, travelToMap, unlockMap } from '../systems/mapSystem.js';
import { getToolUpgradeRows, upgradeTool } from '../systems/toolUpgradeSystem.js';
import { addSkillExp, getSkillRows } from '../systems/skillSystem.js';
import {
  getAestheticScore,
  getDecorationById,
  getSelectedDecoration,
  placeDecoration,
  selectDecoration,
} from '../systems/decorationSystem.js';
import {
  createSystemCatalogState,
  getSystemCatalogView,
  nextSystem,
  previousSystem,
  scrollSystemCatalog,
} from '../systems/systemCatalog.js';

const TILE_SIZE = 32;
const VIEW_WIDTH = 900;
const VIEW_HEIGHT = 560;
const MAP_COLS = 36;
const MAP_ROWS = 24;
const TOOLBAR_Y = 496;
const PLAYER_WALK_SEQUENCE = [0, 1, 2, 1];

const PlotState = {
  EMPTY: 'empty',
  TILLED: 'tilled',
  SEEDED: 'seeded',
  WATERED: 'watered',
  READY: 'ready',
};

const CropTypes = {
  white: {
    name: 'Trắng',
    shortName: 'T',
    duration: 15000,
    color: '#f4f1df',
    accent: '#c9e6b8',
    price: 8,
  },
  green: {
    name: 'Xanh lá',
    shortName: 'L',
    duration: 30000,
    color: '#5ec45e',
    accent: '#2f8b42',
    price: 14,
  },
  blue: {
    name: 'Xanh dương',
    shortName: 'D',
    duration: 60000,
    color: '#5ca7e8',
    accent: '#2d5fa8',
    price: 24,
  },
};

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.gameState = loadGame() ?? createInitialGameState();
    this.money = this.gameState.player.money;
    this.inventory = this.gameState.inventory ?? {
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
    };
    this.chest = this.gameState.chest ?? {
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
    };
    this.plots = new Map();
    this.selectedTool = 'hoe';
    this.selectedCrop = 'white';
    this.selectedItem = 'seed_white';
    this.activePanel = null;
    this.panelGroups = {};
    this.itemRows = {};
    this.chestRows = {};
    this.toolRows = {};
    this.shopRows = {};
    this.toolbarSlots = {};
    this.lastDirection = 'down';
    this.walkFrame = 0;
    this.walkFrameTime = 0;
    this.toolPoseUntil = 0;
    this.storyState = this.gameState.story;
    this.systemCatalogState = createSystemCatalogState();
    this.npcState = this.gameState.npcs;
    this.worldState = this.gameState.world;
    this.questState = this.gameState.quests;
    this.mapState = this.gameState.maps ?? { currentMapId: 'MAP_01', unlockedMapIds: ['MAP_01'] };
    this.decorationState = this.gameState.decorations ?? { selectedDecorationId: 'flowerPot', placed: [] };
    this.npcSprites = {};
    this.decorationSprites = [];
  }

  create() {
    this.createTextures();
    this.createMap();
    this.createPlayer();
    this.createCamera();
    this.createHud();
    this.createControls();
    this.createWeatherEffects();
    this.renderPlacedDecorations();

    this.input.on('pointerdown', (pointer) => this.handleWorldClick(pointer));
    this.input.on('wheel', (_pointer, _gameObjects, _deltaX, deltaY) => {
      if (this.activePanel !== 'systems') return;
      this.scrollGameSystems(deltaY > 0 ? 3 : -3);
    });
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.growCrops(),
    });

    this.setHint('Bấm ô đất để làm nông. Mở balo để chọn loại cây muốn trồng.');
  }

  update() {
    this.movePlayer();
    this.updateWeatherEffects();
  }

  createTextures() {
    if (!this.textures.exists('grass')) this.makeTileTexture('grass', '#78aa55', '#5f914a', 'grass');
    if (!this.textures.exists('soil')) this.makeTileTexture('soil', '#8b5a34', '#6f4026', 'soil');
    if (!this.textures.exists('tilled')) this.makeTileTexture('tilled', '#6f4628', '#4c2e1d', 'tilled');
    if (!this.textures.exists('wateredSoil')) this.makeTileTexture('wateredSoil', '#594032', '#3e5368', 'watered');
    if (!this.textures.exists('path')) this.makeTileTexture('path', '#b99461', '#8d6b42', 'path');
    if (!this.textures.exists('water')) this.makeTileTexture('water', '#4f93bb', '#86d5ef', 'water');
    Object.entries(CropTypes).forEach(([key, crop]) => this.makeCropTextures(key, crop));
    this.makeSeedTexture();
    this.makeVegetableTexture();
    this.makeBackpackTexture();
    this.makeUiIconTextures();
    this.makePlayerTextures();
    if (!this.textures.exists('house')) this.makeHouseTexture();
    if (!this.textures.exists('fence')) this.makeFenceTexture();
    if (!this.textures.exists('tree')) this.makeTreeTexture();
    if (!this.textures.exists('rock')) this.makeRockTexture();
    if (!this.textures.exists('barrel')) this.makeBarrelTexture();
    if (!this.textures.exists('flower')) this.makeFlowerTexture();
    if (!this.textures.exists('bush')) this.makeBushTexture();
    this.makeBlockerTexture();
    this.makeNpcTextures();
    this.createExtractedSpriteTextures();
  }

  createExtractedSpriteTextures() {
    if (!this.textures.exists('farmSpritesReference')) return;

    [
      ['player_down_0', 20, 15, 58, 72],
      ['player_down_1', 105, 15, 58, 72],
      ['player_down_2', 190, 15, 58, 72],
      ['player_up_0', 346, 15, 58, 72],
      ['player_up_1', 431, 15, 58, 72],
      ['player_up_2', 516, 15, 58, 72],
      ['player_left_0', 20, 104, 58, 72],
      ['player_left_1', 105, 104, 58, 72],
      ['player_left_2', 190, 104, 58, 72],
      ['player_right_0', 262, 104, 58, 72],
      ['player_right_1', 347, 104, 58, 72],
      ['player_right_2', 516, 104, 58, 72],
    ].forEach(([key, x, y, w, h]) => this.extractSpriteTexture(key, x, y, w, h, 48, 48));

    this.extractSpriteTexture('hoeIcon', 22, 354, 62, 58, 32, 32);
    this.extractSpriteTexture('waterIcon', 254, 352, 58, 58, 32, 32);
    this.extractSpriteTexture('harvestIcon', 413, 352, 58, 58, 32, 32);
    this.extractSpriteTexture('seedBag', 118, 658, 38, 48, 32, 32);
    this.extractSpriteTexture('backpackIcon', 1218, 713, 70, 64, 32, 32);
    this.extractSpriteTexture('shopIcon', 1200, 815, 116, 86, 32, 32);
    this.extractSpriteTexture('chestIcon', 1340, 724, 90, 74, 32, 32);

    this.extractSpriteTexture('house', 456, 337, 160, 190, 128, 128);
    this.extractSpriteTexture('fence', 1206, 610, 70, 54, 32, 32);
    this.extractSpriteTexture('tree', 1215, 352, 90, 118, 48, 64);
    this.extractSpriteTexture('rock', 1335, 486, 74, 54, 32, 32);
    this.extractSpriteTexture('barrel', 1363, 823, 54, 68, 32, 32);
    this.extractSpriteTexture('flower', 1250, 514, 58, 46, 32, 32);
    this.extractSpriteTexture('bush', 1211, 488, 72, 50, 32, 32);

    this.extractSpriteTexture('white_sprout', 1006, 111, 56, 48, 32, 32);
    this.extractSpriteTexture('white_plant', 1028, 195, 58, 64, 32, 32);
    this.extractSpriteTexture('white_ready', 1030, 290, 60, 70, 32, 32);
    this.extractSpriteTexture('green_sprout', 1066, 111, 58, 48, 32, 32);
    this.extractSpriteTexture('green_plant', 1108, 196, 58, 64, 32, 32);
    this.extractSpriteTexture('green_ready', 1110, 292, 62, 70, 32, 32);
    this.extractSpriteTexture('blue_sprout', 1282, 111, 58, 48, 32, 32);
    this.extractSpriteTexture('blue_plant', 1300, 196, 58, 64, 32, 32);
    this.extractSpriteTexture('blue_ready', 1300, 292, 62, 70, 32, 32);
  }

  extractSpriteTexture(key, sx, sy, sw, sh, dw = sw, dh = sh) {
    if (this.textures.exists(key)) return;

    const source = this.textures.get('farmSpritesReference').getSourceImage();
    const canvas = document.createElement('canvas');
    canvas.width = dw;
    canvas.height = dh;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, dw, dh);

    const image = ctx.getImageData(0, 0, dw, dh);
    const data = image.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r < 20 && g < 28 && b < 35) {
        data[i + 3] = 0;
      }
    }
    ctx.putImageData(image, 0, 0);

    if (this.textures.exists(key)) this.textures.remove(key);
    this.textures.addCanvas(key, canvas);
  }

  makeTileTexture(key, base, accent, variant = 'default') {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

    if (variant === 'grass') {
      ctx.fillStyle = accent;
      for (let i = 0; i < 10; i += 1) {
        const x = (i * 9 + 4) % TILE_SIZE;
        const y = (i * 13 + 3) % TILE_SIZE;
        ctx.fillRect(x, y, 2, 5);
        ctx.fillRect(x + 2, y + 2, 2, 3);
      }
      ctx.fillStyle = '#9acb68';
      ctx.fillRect(21, 7, 3, 3);
      ctx.fillRect(5, 24, 3, 3);
    } else if (variant === 'soil') {
      ctx.fillStyle = accent;
      for (let y = 6; y < TILE_SIZE; y += 9) {
        ctx.fillRect(4, y, 22, 2);
        ctx.fillRect(9, y + 4, 18, 2);
      }
      ctx.fillStyle = '#a36a3d';
      ctx.fillRect(6, 5, 4, 3);
      ctx.fillRect(24, 21, 4, 3);
    } else if (variant === 'tilled' || variant === 'watered') {
      ctx.fillStyle = accent;
      for (let y = 5; y < TILE_SIZE; y += 7) {
        ctx.fillRect(3, y, 26, 3);
      }
      if (variant === 'watered') {
        ctx.fillStyle = 'rgba(116, 180, 215, 0.55)';
        ctx.fillRect(6, 7, 20, 4);
        ctx.fillRect(10, 20, 16, 4);
      }
    } else if (variant === 'path') {
      ctx.fillStyle = accent;
      ctx.fillRect(0, 0, TILE_SIZE, 4);
      ctx.fillRect(0, TILE_SIZE - 4, TILE_SIZE, 4);
      ctx.fillStyle = '#d0ad70';
      ctx.fillRect(6, 8, 5, 4);
      ctx.fillRect(20, 19, 6, 4);
    } else if (variant === 'water') {
      ctx.fillStyle = '#3f7aa5';
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = base;
      ctx.fillRect(0, 3, TILE_SIZE, TILE_SIZE - 6);
      ctx.fillStyle = accent;
      ctx.fillRect(4, 9, 10, 2);
      ctx.fillRect(18, 20, 9, 2);
      ctx.fillRect(9, 27, 12, 2);
    } else {
      ctx.fillStyle = accent;
      for (let i = 0; i < 9; i += 1) {
        ctx.fillRect((i * 11 + 5) % TILE_SIZE, (i * 7 + 3) % TILE_SIZE, 4, 4);
      }
    }

    ctx.strokeStyle = 'rgba(35, 55, 31, 0.35)';
    ctx.strokeRect(0.5, 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
    this.textures.addCanvas(key, canvas);
  }

  makeCropTextures(key, crop) {
    [
      ['sprout', 8, false],
      ['plant', 15, false],
      ['ready', 22, true],
    ].forEach(([stage, height, ready]) => {
      const canvas = document.createElement('canvas');
      canvas.width = TILE_SIZE;
      canvas.height = TILE_SIZE;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(35, 28, 18, 0.22)';
      ctx.fillRect(8, 27, 18, 4);
      ctx.fillStyle = '#315b2c';
      ctx.fillRect(15, TILE_SIZE - height, 3, height);
      ctx.fillStyle = stage === 'sprout' ? '#7cc957' : crop.accent;
      ctx.fillRect(9, TILE_SIZE - height + 4, 8, 5);
      ctx.fillRect(17, TILE_SIZE - height + 1, 8, 5);
      if (ready) {
        ctx.fillStyle = crop.color;
        if (key === 'white') {
          ctx.fillRect(10, 9, 5, 5);
          ctx.fillRect(19, 12, 5, 5);
          ctx.fillRect(15, 5, 5, 5);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(12, 10, 2, 2);
          ctx.fillRect(17, 6, 2, 2);
        } else if (key === 'green') {
          ctx.fillRect(9, 8, 7, 7);
          ctx.fillRect(18, 10, 7, 7);
          ctx.fillRect(14, 4, 7, 7);
          ctx.fillStyle = '#9ee083';
          ctx.fillRect(11, 10, 3, 3);
          ctx.fillRect(20, 12, 3, 3);
        } else {
          ctx.fillRect(10, 7, 6, 9);
          ctx.fillRect(19, 11, 6, 9);
          ctx.fillRect(15, 3, 6, 9);
          ctx.fillStyle = '#9dd4ff';
          ctx.fillRect(12, 8, 2, 3);
          ctx.fillRect(17, 4, 2, 3);
        }
      }
      this.textures.addCanvas(`${key}_${stage}`, canvas);
    });
  }

  makeSeedTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#d8b15f';
    ctx.fillRect(10, 14, 5, 5);
    ctx.fillRect(17, 10, 5, 5);
    ctx.fillRect(18, 19, 5, 5);
    this.textures.addCanvas('seedBag', canvas);
  }

  makeVegetableTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#5ca044';
    ctx.fillRect(11, 8, 10, 5);
    ctx.fillStyle = '#d86b45';
    ctx.fillRect(12, 13, 9, 12);
    ctx.fillRect(15, 25, 4, 3);
    this.textures.addCanvas('vegetable', canvas);
  }

  makeBackpackTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#332219';
    ctx.fillRect(12, 6, 8, 5);
    ctx.fillStyle = '#5b3828';
    ctx.fillRect(9, 10, 16, 20);
    ctx.fillStyle = '#8b5a34';
    ctx.fillRect(7, 14, 20, 16);
    ctx.fillStyle = '#b57a42';
    ctx.fillRect(11, 17, 12, 6);
    ctx.fillStyle = '#f0c46c';
    ctx.fillRect(15, 20, 4, 4);
    ctx.fillStyle = '#2b1d15';
    ctx.fillRect(7, 18, 3, 8);
    ctx.fillRect(24, 18, 3, 8);
    this.textures.addCanvas('backpackIcon', canvas);
  }

  makeUiIconTextures() {
    this.makeIconTexture('hoeIcon', (ctx) => {
      ctx.fillStyle = '#7d5133';
      ctx.fillRect(15, 7, 4, 22);
      ctx.fillStyle = '#c9c4b6';
      ctx.fillRect(8, 7, 17, 5);
      ctx.fillRect(7, 11, 5, 5);
    });
    this.makeIconTexture('waterIcon', (ctx) => {
      ctx.fillStyle = '#4b8fc6';
      ctx.fillRect(10, 9, 14, 20);
      ctx.fillStyle = '#75c9ed';
      ctx.fillRect(14, 5, 6, 6);
      ctx.fillRect(21, 13, 6, 4);
    });
    this.makeIconTexture('harvestIcon', (ctx) => {
      ctx.fillStyle = '#d8b15f';
      ctx.fillRect(9, 10, 5, 16);
      ctx.fillRect(16, 7, 5, 19);
      ctx.fillRect(23, 12, 4, 14);
      ctx.fillStyle = '#6fa34b';
      ctx.fillRect(8, 7, 18, 5);
    });
    this.makeIconTexture('shopIcon', (ctx) => {
      ctx.fillStyle = '#b15d3c';
      ctx.fillRect(6, 11, 22, 18);
      ctx.fillStyle = '#f0d17a';
      ctx.fillRect(8, 6, 18, 7);
      ctx.fillStyle = '#5b3828';
      ctx.fillRect(13, 19, 8, 10);
    });
    this.makeIconTexture('chestIcon', (ctx) => {
      ctx.fillStyle = '#7a4d32';
      ctx.fillRect(6, 11, 22, 18);
      ctx.fillStyle = '#b57a42';
      ctx.fillRect(6, 11, 22, 6);
      ctx.fillStyle = '#f0c46c';
      ctx.fillRect(14, 17, 5, 5);
    });
    this.makeIconTexture('coinIcon', (ctx) => {
      ctx.fillStyle = '#c7852d';
      ctx.fillRect(9, 9, 14, 14);
      ctx.fillStyle = '#ffd46b';
      ctx.fillRect(11, 7, 14, 14);
      ctx.fillStyle = '#9b6225';
      ctx.fillRect(16, 11, 4, 10);
    });
    this.makeIconTexture('bookIcon', (ctx) => {
      ctx.fillStyle = '#5b3828';
      ctx.fillRect(7, 7, 8, 20);
      ctx.fillRect(17, 7, 8, 20);
      ctx.fillStyle = '#f0d3a0';
      ctx.fillRect(9, 9, 6, 16);
      ctx.fillRect(17, 9, 6, 16);
      ctx.fillStyle = '#8b5a34';
      ctx.fillRect(15, 8, 2, 18);
      ctx.fillStyle = '#7a3f25';
      ctx.fillRect(10, 13, 4, 2);
      ctx.fillRect(18, 13, 4, 2);
      ctx.fillRect(10, 18, 4, 2);
      ctx.fillRect(18, 18, 4, 2);
    });
    this.makeIconTexture('questIcon', (ctx) => {
      ctx.fillStyle = '#5b3828';
      ctx.fillRect(8, 5, 16, 22);
      ctx.fillStyle = '#f4f1df';
      ctx.fillRect(10, 7, 12, 18);
      ctx.fillStyle = '#7a3f25';
      ctx.fillRect(12, 11, 8, 2);
      ctx.fillRect(12, 15, 8, 2);
      ctx.fillRect(12, 19, 6, 2);
      ctx.fillStyle = '#4b6f3b';
      ctx.fillRect(19, 22, 5, 5);
    });
    this.makeIconTexture('mapIcon', (ctx) => {
      ctx.fillStyle = '#f4f1df';
      ctx.fillRect(6, 7, 20, 18);
      ctx.fillStyle = '#d9aa67';
      ctx.fillRect(12, 7, 2, 18);
      ctx.fillRect(20, 7, 2, 18);
      ctx.fillStyle = '#4b6f3b';
      ctx.fillRect(8, 10, 5, 5);
      ctx.fillStyle = '#4f93bb';
      ctx.fillRect(15, 15, 5, 5);
      ctx.fillStyle = '#7a3f25';
      ctx.fillRect(22, 11, 3, 3);
      ctx.fillRect(9, 21, 3, 3);
    });
    this.makeIconTexture('weatherIcon', (ctx) => {
      ctx.fillStyle = '#f4f1df';
      ctx.fillRect(8, 12, 16, 8);
      ctx.fillRect(11, 8, 10, 8);
      ctx.fillStyle = '#75c9ed';
      ctx.fillRect(9, 23, 2, 5);
      ctx.fillRect(15, 23, 2, 5);
      ctx.fillRect(21, 23, 2, 5);
      ctx.fillStyle = '#ffd46b';
      ctx.fillRect(22, 6, 5, 5);
    });
    this.makeIconTexture('moonIcon', (ctx) => {
      ctx.fillStyle = '#263a59';
      ctx.fillRect(7, 7, 18, 18);
      ctx.fillStyle = '#f4f1df';
      ctx.fillRect(11, 7, 12, 18);
      ctx.fillStyle = '#263a59';
      ctx.fillRect(17, 6, 10, 16);
      ctx.fillStyle = '#f4f1df';
      ctx.fillRect(9, 25, 3, 3);
      ctx.fillRect(24, 10, 2, 2);
    });
  }

  makeIconTexture(key, draw) {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');
    draw(ctx);
    this.textures.addCanvas(key, canvas);
  }

  makeNpcTextures() {
    greenHollowNpcs.forEach((npc) => {
      const canvas = document.createElement('canvas');
      canvas.width = TILE_SIZE;
      canvas.height = TILE_SIZE;
      const ctx = canvas.getContext('2d');
      const shirt = Phaser.Display.Color.IntegerToColor(npc.color).rgba;

      ctx.fillStyle = 'rgba(30, 24, 18, 0.25)';
      ctx.fillRect(7, 29, 18, 3);
      ctx.fillStyle = '#4b3124';
      ctx.fillRect(8, 4, 16, 6);
      ctx.fillRect(6, 8, 20, 5);
      ctx.fillStyle = '#f0c08a';
      ctx.fillRect(10, 8, 12, 10);
      ctx.fillStyle = '#1f1b18';
      ctx.fillRect(12, 12, 2, 2);
      ctx.fillRect(19, 12, 2, 2);
      ctx.fillStyle = shirt;
      ctx.fillRect(9, 18, 14, 10);
      ctx.fillStyle = '#f0c08a';
      ctx.fillRect(6, 19, 4, 7);
      ctx.fillRect(23, 19, 4, 7);
      ctx.fillStyle = '#263a59';
      ctx.fillRect(9, 27, 5, 4);
      ctx.fillRect(18, 27, 5, 4);

      this.textures.addCanvas(`npc_${npc.id}`, canvas);
    });
  }

  makePlayerTextures() {
    ['down', 'up', 'left', 'right'].forEach((direction) => {
      [0, 1, 2].forEach((frame) => {
        const canvas = document.createElement('canvas');
        canvas.width = TILE_SIZE;
        canvas.height = TILE_SIZE;
        const ctx = canvas.getContext('2d');
        const step = frame === 1 ? -2 : frame === 2 ? 2 : 0;
        const isSide = direction === 'left' || direction === 'right';

        ctx.fillStyle = 'rgba(30, 24, 18, 0.25)';
        ctx.fillRect(7, 29, 18, 3);
        ctx.fillStyle = '#2f5d8a';
        ctx.fillRect(9, 13, 14, 14);
        ctx.fillStyle = '#4275a6';
        ctx.fillRect(11, 14, 10, 4);
        ctx.fillStyle = '#f0c08a';
        ctx.fillRect(10, 5, 12, 10);
        ctx.fillStyle = '#4b3124';
        ctx.fillRect(8, 3, 16, 5);
        ctx.fillStyle = '#1f1b18';
        if (direction === 'down') {
          ctx.fillRect(12, 9, 2, 2);
          ctx.fillRect(19, 9, 2, 2);
        } else if (direction === 'left') {
          ctx.fillRect(10, 9, 2, 2);
        } else if (direction === 'right') {
          ctx.fillRect(20, 9, 2, 2);
        }
        ctx.fillStyle = '#f0c08a';
        if (isSide) {
          ctx.fillRect(direction === 'left' ? 6 : 23, 15 + step, 4, 10);
        } else {
          ctx.fillRect(6, 15 - step, 4, 10);
          ctx.fillRect(23, 15 + step, 4, 10);
        }
        ctx.fillStyle = '#1c2f4c';
        ctx.fillRect(8, 27 + Math.max(step, 0), 6, 4);
        ctx.fillRect(18, 27 + Math.max(-step, 0), 6, 4);
        this.textures.addCanvas(`player_${direction}_${frame}`, canvas);
      });
    });
  }

  makeBlockerTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    canvas.getContext('2d').clearRect(0, 0, 1, 1);
    this.textures.addCanvas('blocker', canvas);
  }

  makeHouseTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(35, 28, 18, 0.25)';
    ctx.fillRect(10, 58, 78, 5);
    ctx.fillStyle = '#8f4b32';
    ctx.fillRect(16, 26, 64, 34);
    ctx.fillStyle = '#b76a45';
    ctx.fillRect(21, 31, 54, 5);
    ctx.fillStyle = '#5d2e26';
    ctx.fillRect(8, 18, 80, 12);
    ctx.fillRect(18, 8, 60, 12);
    ctx.fillStyle = '#e0b86d';
    ctx.fillRect(42, 40, 14, 20);
    ctx.fillStyle = '#5b3828';
    ctx.fillRect(53, 49, 2, 3);
    ctx.fillStyle = '#92c9d7';
    ctx.fillRect(24, 34, 12, 10);
    ctx.fillRect(62, 34, 12, 10);
    this.textures.addCanvas('house', canvas);
  }

  makeFenceTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(35, 28, 18, 0.2)';
    ctx.fillRect(4, 28, 26, 3);
    ctx.fillStyle = '#7a5432';
    ctx.fillRect(6, 9, 5, 20);
    ctx.fillRect(22, 9, 5, 20);
    ctx.fillStyle = '#a97845';
    ctx.fillRect(3, 13, 28, 5);
    ctx.fillRect(3, 22, 28, 5);
    this.textures.addCanvas('fence', canvas);
  }

  makeTreeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(35, 28, 18, 0.22)';
    ctx.fillRect(6, 42, 22, 4);
    ctx.fillStyle = '#6b4426';
    ctx.fillRect(14, 25, 7, 18);
    ctx.fillStyle = '#2f7d3d';
    ctx.fillRect(7, 12, 20, 18);
    ctx.fillStyle = '#3d9a4b';
    ctx.fillRect(11, 4, 14, 14);
    ctx.fillRect(3, 18, 14, 12);
    ctx.fillStyle = '#61b75d';
    ctx.fillRect(12, 7, 5, 4);
    ctx.fillRect(8, 16, 4, 4);
    this.textures.addCanvas('tree', canvas);
  }

  makeRockTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(35, 28, 18, 0.22)';
    ctx.fillRect(7, 26, 20, 3);
    ctx.fillStyle = '#7d8685';
    ctx.fillRect(8, 15, 18, 11);
    ctx.fillRect(12, 10, 12, 8);
    ctx.fillStyle = '#aab2ae';
    ctx.fillRect(12, 12, 6, 4);
    ctx.fillStyle = '#596160';
    ctx.fillRect(20, 21, 5, 4);
    this.textures.addCanvas('rock', canvas);
  }

  makeBarrelTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(35, 28, 18, 0.22)';
    ctx.fillRect(8, 29, 20, 3);
    ctx.fillStyle = '#8b542f';
    ctx.fillRect(10, 8, 14, 22);
    ctx.fillStyle = '#c07a3d';
    ctx.fillRect(8, 10, 18, 5);
    ctx.fillRect(8, 23, 18, 5);
    ctx.fillStyle = '#4c3425';
    ctx.fillRect(9, 16, 16, 3);
    ctx.fillStyle = '#e2a158';
    ctx.fillRect(12, 10, 4, 18);
    this.textures.addCanvas('barrel', canvas);
  }

  makeFlowerTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#3d7d38';
    ctx.fillRect(15, 14, 2, 12);
    ctx.fillStyle = '#f2d35f';
    ctx.fillRect(12, 10, 4, 4);
    ctx.fillRect(18, 10, 4, 4);
    ctx.fillStyle = '#e37aa4';
    ctx.fillRect(15, 7, 4, 4);
    ctx.fillRect(15, 13, 4, 4);
    this.textures.addCanvas('flower', canvas);
  }

  makeBushTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(35, 28, 18, 0.18)';
    ctx.fillRect(6, 26, 23, 3);
    ctx.fillStyle = '#3f8c45';
    ctx.fillRect(8, 15, 18, 11);
    ctx.fillStyle = '#5eb95a';
    ctx.fillRect(12, 10, 14, 10);
    ctx.fillRect(4, 18, 12, 8);
    this.textures.addCanvas('bush', canvas);
  }

  createMap() {
    this.blockers = this.physics.add.staticGroup();

    for (let row = 0; row < MAP_ROWS; row += 1) {
      for (let col = 0; col < MAP_COLS; col += 1) {
        const isWater = col >= 31 || (col >= 28 && row < 5);
        const isPath = row === 12 || row === 18 || col === 3 || (row >= 2 && row <= 18 && col === 15);
        const isWaterEdge = isWater && (col === 31 || col === 28 || row === 5);
        const isSand = !isWater && ((col >= 27 && col <= 30 && row < 7) || (col >= 29 && row >= 5));
        const isStone = !isWater && row < 3 && col < 6;
        const texture = this.getMapBaseTexture(col, row, { isWater, isPath, isWaterEdge, isSand, isStone });
        this.add.image(col * TILE_SIZE, row * TILE_SIZE, texture).setOrigin(0);
        if (isWater) this.createBlocker(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }

    for (let row = 4; row < 11; row += 1) {
      for (let col = 5; col < 14; col += 1) {
        const id = this.plotId(col, row);
        const tile = this.add.image(col * TILE_SIZE, row * TILE_SIZE, 'soil').setOrigin(0);
        tile.setInteractive();
        this.plots.set(id, {
          col,
          row,
          state: PlotState.EMPTY,
          tile,
          plant: null,
          cropType: null,
          wateredAt: 0,
        });
      }
    }

    this.createProps();
  }

  getMapBaseTexture(col, row, terrain) {
    const mapId = this.mapState.currentMapId;
    if (mapId === 'MAP_02') return terrain.isPath || (col + row) % 3 === 0 ? 'path' : 'stoneGround';
    if (mapId === 'MAP_03') return (col + row) % 5 === 0 ? 'path' : 'stoneGround';
    if (mapId === 'MAP_04') return this.pickGrassTexture(col, row);
    if (mapId === 'MAP_05') return terrain.isWater || col > 25 ? 'water' : 'sand';
    if (mapId === 'MAP_06') return terrain.isStone ? 'stoneGround' : 'tilled';
    if (mapId === 'MAP_07') return terrain.isPath ? 'path' : 'stoneGround';

    return terrain.isWater
          ? (terrain.isWaterEdge && this.textures.exists('waterEdge') ? 'waterEdge' : 'water')
          : terrain.isPath
            ? 'path'
            : terrain.isSand && this.textures.exists('sand')
              ? 'sand'
              : terrain.isStone && this.textures.exists('stoneGround')
                ? 'stoneGround'
                : this.pickGrassTexture(col, row);
  }

  pickGrassTexture(col, row) {
    if (this.textures.exists('grassFlowers') && (col * 17 + row * 23) % 29 === 0) return 'grassFlowers';
    if (this.textures.exists('grassAlt') && (col * 7 + row * 11) % 5 === 0) return 'grassAlt';
    return 'grass';
  }

  createProps() {
    this.add.image(32, 18, 'house').setOrigin(0);
    this.createBlocker(42, 66, 108, 58);
    this.add.image(120, 92, 'seedBag').setOrigin(0);
    this.add.image(152, 92, 'vegetable').setOrigin(0);

    for (let col = 4; col < 15; col += 1) {
      this.add.image(col * TILE_SIZE, 3 * TILE_SIZE, 'fence').setOrigin(0);
      this.createBlocker(col * TILE_SIZE, 3 * TILE_SIZE + 10, TILE_SIZE, 20);
      if (col !== 9 && col !== 10) {
        this.add.image(col * TILE_SIZE, 11 * TILE_SIZE, 'fence').setOrigin(0);
        this.createBlocker(col * TILE_SIZE, 11 * TILE_SIZE + 10, TILE_SIZE, 20);
      }
    }
    for (let row = 4; row < 11; row += 1) {
      this.add.image(4 * TILE_SIZE, row * TILE_SIZE, 'fence').setOrigin(0);
      this.add.image(14 * TILE_SIZE, row * TILE_SIZE, 'fence').setOrigin(0);
      this.createBlocker(4 * TILE_SIZE, row * TILE_SIZE + 10, TILE_SIZE, 20);
      this.createBlocker(14 * TILE_SIZE, row * TILE_SIZE + 10, TILE_SIZE, 20);
    }

    [[1, 11], [2, 13], [16, 9], [17, 12]].forEach(([col, row]) => {
      this.add.image(col * TILE_SIZE, row * TILE_SIZE - 16, 'tree').setOrigin(0);
      this.createBlocker(col * TILE_SIZE + 8, row * TILE_SIZE + 10, 16, 18);
    });
    [[18, 6], [19, 10], [2, 7]].forEach(([col, row]) => {
      this.add.image(col * TILE_SIZE, row * TILE_SIZE, 'rock').setOrigin(0);
      this.createBlocker(col * TILE_SIZE + 6, row * TILE_SIZE + 10, 20, 18);
    });

    this.add.image(96, 86, 'barrel').setOrigin(0);
    this.add.image(128, 86, 'barrel').setOrigin(0);
    this.createBlocker(104, 96, 16, 20);
    this.createBlocker(136, 96, 16, 20);

    [[6, 13], [10, 13], [13, 14], [21, 11], [23, 15], [27, 18]].forEach(([col, row]) => {
      this.add.image(col * TILE_SIZE, row * TILE_SIZE, 'flower').setOrigin(0);
    });
    [[7, 2], [12, 2], [20, 6], [24, 10], [26, 14]].forEach(([col, row]) => {
      this.add.image(col * TILE_SIZE, row * TILE_SIZE, 'bush').setOrigin(0);
    });

    this.createNpcs();
  }

  createNpcs() {
    greenHollowNpcs.forEach((npc) => {
      const x = npc.position.col * TILE_SIZE + TILE_SIZE / 2;
      const y = npc.position.row * TILE_SIZE + TILE_SIZE / 2;
      const sprite = this.physics.add.sprite(x, y, `npc_${npc.id}`);
      sprite.npcId = npc.id;
      sprite.setImmovable(true);
      sprite.setSize(18, 14);
      sprite.setOffset(7, 18);
      sprite.setInteractive({ useHandCursor: true });
      sprite.on('pointerdown', () => this.handleNpcClick(npc.id));

      const label = this.add.text(x, y - 28, npc.name, this.textStyle(10, '#fff2cf')).setOrigin(0.5);
      label.setDepth(10);
      this.npcSprites[npc.id] = { sprite, label };
    });
  }

  createBlocker(x, y, width, height) {
    const blocker = this.blockers.create(x + width / 2, y + height / 2, 'blocker');
    blocker.setDisplaySize(width, height);
    blocker.refreshBody();
  }

  createPlayer() {
    this.player = this.physics.add.sprite(96, 128, 'player_front_0');
    this.player.setCollideWorldBounds(true);
    this.player.setSize(18, 14);
    this.player.setOffset(7, 18);
    this.physics.add.collider(this.player, this.blockers);
    Object.values(this.npcSprites).forEach(({ sprite }) => {
      this.physics.add.collider(this.player, sprite);
    });
    this.physics.world.setBounds(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);
  }

  createCamera() {
    this.cameras.main.setViewport(0, 0, 900, VIEW_HEIGHT);
    this.cameras.main.setBounds(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(96, 72);
  }

  createControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,U,P,R,ONE,TWO,THREE,FOUR,FIVE,SIX,SEVEN');
  }

  createHud() {
    this.fixed(this.add.rectangle(680, 10, 208, 76, 0x6f4428).setOrigin(0));
    this.fixed(this.add.rectangle(686, 16, 196, 64, 0xf0d3a0).setOrigin(0));
    this.dateText = this.fixed(this.add.text(700, 24, '', this.textStyle(15, '#4c2f1d')));
    this.statsText = this.fixed(this.add.text(700, 50, '', this.textStyle(14, '#4c2f1d', 174)));

    this.fixed(this.add.rectangle(16, TOOLBAR_Y - 8, 872, 58, 0x6f4428).setOrigin(0));
    this.fixed(this.add.rectangle(24, TOOLBAR_Y, 856, 42, 0xd9aa67).setOrigin(0));
    [
      ['hoe', 'hoeIcon', () => this.selectTool('hoe')],
      ['seed', 'seedBag', () => this.selectTool('seed')],
      ['water', 'waterIcon', () => this.selectTool('water')],
      ['harvest', 'harvestIcon', () => this.selectTool('harvest')],
      ['inventory', 'backpackIcon', () => this.togglePanel('inventory')],
      ['shop', 'shopIcon', () => this.togglePanel('shop')],
      ['chest', 'chestIcon', () => this.togglePanel('chest')],
      ['quests', 'questIcon', () => this.togglePanel('quests')],
      ['maps', 'mapIcon', () => this.togglePanel('maps')],
      ['weather', 'weatherIcon', () => this.togglePanel('weather')],
      ['story', 'tree', () => this.togglePanel('story')],
      ['systems', 'bookIcon', () => this.togglePanel('systems')],
      ['sleep', 'moonIcon', () => this.sleepToNextDay()],
      ['sell', 'coinIcon', () => this.sellSelectedItem()],
    ].forEach(([key, icon, onClick], index) => {
      this.toolbarSlots[key] = this.createToolbarSlot(20 + index * 61, TOOLBAR_Y + 4, key, icon, onClick);
    });

    this.hintBox = this.fixed(this.add.rectangle(16, 16, 392, 58, 0x263821, 0.86).setOrigin(0));
    this.hintText = this.fixed(this.add.text(28, 26, '', this.textStyle(13, '#fff2cf', 350)));
    this.createShopPanel();
    this.createInventoryPanel();
    this.createChestPanel();
    createQuestJournalPanel(this);
    createMapPanel(this);
    createWeatherPanel(this);
    createStoryPanel(this);
    createSystemCatalogPanel(this);
    createToolUpgradePanel(this);
    createPlayerProfilePanel(this);
    createDecorationPanel(this);
    this.refreshHud();
  }

  createPanel(name, titleText, width = 420, height = 286) {
    const group = this.add.group();
    const x = (900 - width) / 2;
    const y = 86;
    const panel = this.fixed(this.add.rectangle(x, y, width, height, 0x6f4428).setOrigin(0));
    const inner = this.fixed(this.add.rectangle(x + 8, y + 8, width - 16, height - 16, 0xf0d3a0).setOrigin(0));
    const title = this.fixed(this.add.text(x + 22, y + 18, titleText, this.textStyle(18, '#4c2f1d')));
    const close = this.fixed(this.add.text(x + width - 64, y + 20, 'Đóng', this.textStyle(13, '#7a3f25')));
    close.setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => this.togglePanel(null));
    group.addMultiple([panel, inner, title, close]);
    group.setVisible(false);
    this.panelGroups[name] = group;
    return { group, x, y, width, height };
  }

  createShopPanel() {
    const panel = this.createPanel('shop', 'Shop hạt giống');
    const { group, x, y } = panel;
    Object.entries(CropTypes).forEach(([key, crop], index) => {
      const rowY = y + 68 + index * 54;
      const row = this.fixed(this.add.rectangle(x + 28, rowY, 364, 42, 0xd9aa67).setOrigin(0));
      const swatch = this.fixed(this.add.rectangle(x + 44, rowY + 12, 18, 18, Phaser.Display.Color.HexStringToColor(crop.color).color).setOrigin(0));
      const label = this.fixed(this.add.text(x + 78, rowY + 11, `${crop.name} - hạt giống $4`, this.textStyle(14, '#4c2f1d')));
      row.setInteractive({ useHandCursor: true });
      row.on('pointerdown', () => this.buySeed(key));
      this.shopRows[key] = row;
      group.addMultiple([row, swatch, label]);
    });
    group.setVisible(false);
  }

  createInventoryPanel() {
    const panel = this.createPanel('inventory', 'Túi đồ', 468, 318);
    const { group, x, y } = panel;
    this.itemKeys().forEach((itemKey, index) => {
      const col = index % 4;
      const rowIndex = Math.floor(index / 4);
      const slotX = x + 30 + col * 108;
      const slotY = y + 72 + rowIndex * 82;
      const row = this.fixed(this.add.rectangle(slotX, slotY, 92, 66, 0xd9aa67).setOrigin(0));
      const iconKey = this.itemIcon(itemKey);
      const icon = this.fixed(this.add.image(slotX + 46, slotY + 24, iconKey));
      const label = this.fixed(this.add.text(slotX + 8, slotY + 46, this.itemLabel(itemKey), this.textStyle(11, '#4c2f1d', 80)));
      row.setInteractive({ useHandCursor: true });
      row.on('pointerdown', () => this.selectItem(itemKey));
      this.itemRows[itemKey] = { row, label };
      group.addMultiple([row, icon, label]);
    });
    group.setVisible(false);
  }

  createChestPanel() {
    const panel = this.createPanel('chest', 'Rương chứa đồ', 468, 344);
    const { group, x, y } = panel;
    this.itemKeys().forEach((itemKey, index) => {
      const col = index % 4;
      const rowIndex = Math.floor(index / 4);
      const slotX = x + 30 + col * 108;
      const slotY = y + 72 + rowIndex * 74;
      const row = this.fixed(this.add.rectangle(slotX, slotY, 92, 58, 0xd9aa67).setOrigin(0));
      const label = this.fixed(this.add.text(slotX + 8, slotY + 16, '', this.textStyle(11, '#4c2f1d', 80)));
      row.setInteractive({ useHandCursor: true });
      row.on('pointerdown', () => this.selectItem(itemKey));
      this.chestRows[itemKey] = { row, label };
      group.addMultiple([row, label]);
    });
    const deposit = this.createPanelButton(group, x + 116, y + 294, 92, 32, 'Cất', () => this.depositSelectedItem());
    const withdraw = this.createPanelButton(group, x + 260, y + 294, 92, 32, 'Lấy', () => this.withdrawSelectedItem());
    group.addMultiple([deposit.bg, deposit.text, withdraw.bg, withdraw.text]);
    group.setVisible(false);
  }

  createPanelButton(group, x, y, width, height, label, onClick) {
    const bg = this.fixed(this.add.rectangle(x, y, width, height, 0x4b6f3b).setOrigin(0));
    const text = this.fixed(this.add.text(x + 10, y + 6, label, this.textStyle(12, '#ffffff')));
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', onClick);
    bg.on('pointerover', () => bg.setFillStyle(0x5d8549));
    bg.on('pointerout', () => bg.setFillStyle(0x4b6f3b));
    return { bg, text };
  }

  textStyle(size, color, wrapWidth = null) {
    return {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${size}px`,
      color,
      lineSpacing: 5,
      wordWrap: wrapWidth ? { width: wrapWidth } : undefined,
    };
  }

  createButton(x, y, width, height, label, onClick) {
    const bg = this.fixed(this.add.rectangle(x, y, width, height, 0x4b6f3b).setOrigin(0));
    this.fixed(this.add.text(x + 10, y + 8, label, this.textStyle(13, '#ffffff')));
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', onClick);
    bg.on('pointerover', () => bg.setFillStyle(0x5d8549));
    bg.on('pointerout', () => bg.setFillStyle(0x4b6f3b));
    return bg;
  }

  createToolbarSlot(x, y, key, textureKey, onClick) {
    const bg = this.fixed(this.add.rectangle(x, y, 48, 38, 0xf0d3a0).setOrigin(0));
    const icon = this.fixed(this.add.image(x + 24, y + 19, textureKey));
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', onClick);
    bg.on('pointerover', () => bg.setFillStyle(0xffe2a8));
    bg.on('pointerout', () => this.refreshHud());
    return { bg, icon, key };
  }

  createIconButton(x, y, width, height, textureKey, onClick) {
    const bg = this.fixed(this.add.rectangle(x, y, width, height, 0x4b6f3b).setOrigin(0));
    const icon = this.fixed(this.add.image(x + width / 2, y + height / 2, textureKey));
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', onClick);
    bg.on('pointerover', () => bg.setFillStyle(0x5d8549));
    bg.on('pointerout', () => bg.setFillStyle(0x4b6f3b));
    return { bg, icon };
  }

  fixed(gameObject) {
    gameObject.setScrollFactor(0);
    gameObject.setDepth(1000);
    return gameObject;
  }

  movePlayer() {
    const speed = 150;
    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || this.keys.A.isDown) vx -= speed;
    if (this.cursors.right.isDown || this.keys.D.isDown) vx += speed;
    if (this.cursors.up.isDown || this.keys.W.isDown) vy -= speed;
    if (this.cursors.down.isDown || this.keys.S.isDown) vy += speed;
    if (Phaser.Input.Keyboard.JustDown(this.keys.U)) this.togglePanel('tools');
    if (Phaser.Input.Keyboard.JustDown(this.keys.P)) this.togglePanel('profile');
    if (Phaser.Input.Keyboard.JustDown(this.keys.R)) this.togglePanel('decor');

    if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) this.travelToUnlockedMap(0);
    if (Phaser.Input.Keyboard.JustDown(this.keys.TWO)) this.travelToUnlockedMap(1);
    if (Phaser.Input.Keyboard.JustDown(this.keys.THREE)) this.travelToUnlockedMap(2);
    if (Phaser.Input.Keyboard.JustDown(this.keys.FOUR)) this.travelToUnlockedMap(3);
    if (Phaser.Input.Keyboard.JustDown(this.keys.FIVE)) this.travelToUnlockedMap(4);
    if (Phaser.Input.Keyboard.JustDown(this.keys.SIX)) this.travelToUnlockedMap(5);
    if (Phaser.Input.Keyboard.JustDown(this.keys.SEVEN)) this.travelToUnlockedMap(6);

    this.player.setVelocity(vx, vy);
    if (vx !== 0 && vy !== 0) this.player.setVelocity(vx * 0.7071, vy * 0.7071);
    this.updatePlayerAnimation(vx, vy);
  }

  updatePlayerAnimation(vx, vy) {
    const isMoving = vx !== 0 || vy !== 0;
    if (!isMoving && this.time.now < this.toolPoseUntil) return;

    if (isMoving) {
      if (Math.abs(vx) > Math.abs(vy)) {
        this.lastDirection = vx > 0 ? 'right' : 'left';
      } else {
        this.lastDirection = vy > 0 ? 'down' : 'up';
      }
      if (this.time.now - this.walkFrameTime > 140) {
        this.walkFrame = (this.walkFrame + 1) % PLAYER_WALK_SEQUENCE.length;
        this.walkFrameTime = this.time.now;
      }
    } else {
      this.walkFrame = 0;
    }
    this.player.setFlipX(this.lastDirection === 'left');
    this.player.setTexture(this.getPlayerFrameKey(this.lastDirection, this.walkFrame));
  }

  getPlayerFrameKey(direction, frame) {
    const textureFrame = PLAYER_WALK_SEQUENCE[frame] ?? 0;
    if (direction === 'left' || direction === 'right') return `player_side_${textureFrame}`;
    return `player_front_${textureFrame}`;
  }

  showPlayerToolPose(textureKey) {
    if (!this.player || !this.textures.exists(textureKey)) return;
    this.player.setFlipX(this.lastDirection === 'left');
    this.player.setTexture(textureKey);
    this.toolPoseUntil = this.time.now + 280;
  }

  handleWorldClick(pointer) {
    if (this.activePanel || pointer.y >= TOOLBAR_Y - 12) return;

    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const col = Math.floor(worldPoint.x / TILE_SIZE);
    const row = Math.floor(worldPoint.y / TILE_SIZE);
    if (this.selectedTool === 'decor') return this.placeSelectedDecoration(col, row);

    const plot = this.plots.get(this.plotId(col, row));
    if (!plot) return this.setHint('Chỉ các ô đất màu nâu mới làm nông được.');

    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      col * TILE_SIZE + TILE_SIZE / 2,
      row * TILE_SIZE + TILE_SIZE / 2,
    );
    if (distance > TILE_SIZE * 2.2) return this.setHint('Hãy đi lại gần ô đất đó trước.');

    return this.usePlot(plot);
  }

  handleNpcClick(npcId) {
    if (this.activePanel) return;
    const npcEntry = this.npcSprites[npcId];
    if (!npcEntry) return;

    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      npcEntry.sprite.x,
      npcEntry.sprite.y,
    );
    if (distance > TILE_SIZE * 2.2) {
      this.setHint('Hay lai gan NPC hon de noi chuyen.');
      return;
    }

    if (this.isGiftItem(this.selectedItem)) {
      const npc = getNpcById(npcId);
      if (!npc) return;
      if (this.inventory[this.selectedItem] <= 0) {
        this.setHint('Ban khong con mon qua nay trong tui.');
        return;
      }
      const giftName = this.itemLabel(this.selectedItem);
      const giftResult = giveGiftToNpc(this.npcState, npc, giftName);
      this.inventory[this.selectedItem] -= 1;
      this.gainSkillExp('gift');
      this.persistGameState();
      this.refreshHud();
      this.setHint(`${npc.name}: ${giftResult.reaction} ${giftName} (${giftResult.delta > 0 ? '+' : ''}${giftResult.delta} tim)`);
      return;
    }

    const result = talkToNpc(this.npcState, npcId);
    if (!result) return;
    this.gainSkillExp('talk');
    this.persistGameState();
    const toolHint = npcId === 'anhMinh' ? ' Bam U de nang cap dung cu.' : '';
    this.setHint(`${result.npc.name}: ${result.dialogue}  Tim: ${result.friendship.toFixed(2)}/10${toolHint}`);
  }

  selectDecorationItem(decorationId) {
    if (!selectDecoration(this.decorationState, decorationId)) return;
    const item = getSelectedDecoration(this.decorationState);
    this.selectedTool = 'decor';
    this.togglePanel(null);
    this.setHint(`Da chon ${item.name}. Bam len dat trong map de dat trang tri.`);
    this.refreshHud();
  }

  placeSelectedDecoration(col, row) {
    if (col < 0 || row < 0 || col >= MAP_COLS || row >= MAP_ROWS) return;
    const existing = this.decorationState.placed.some((item) => item.col === col && item.row === row);
    if (existing) return this.setHint('O nay da co trang tri.');
    const item = placeDecoration(this.decorationState, col, row);
    this.addDecorationSprite(item, col, row);
    this.persistGameState();
    this.refreshHud();
    return this.setHint(`Da dat ${item.name}. Diem tham my: ${getAestheticScore(this.decorationState)}/100.`);
  }

  addDecorationSprite(item, col, row) {
    const sprite = this.add.image(col * TILE_SIZE, row * TILE_SIZE, item.texture).setOrigin(0);
    this.decorationSprites.push(sprite);
  }

  renderPlacedDecorations() {
    this.decorationSprites.forEach((sprite) => sprite.destroy());
    this.decorationSprites = [];
    this.decorationState.placed.forEach((placed) => {
      const item = getDecorationById(placed.id);
      if (item) this.addDecorationSprite(item, placed.col, placed.row);
    });
  }

  usePlot(plot) {
    if (plot.state === PlotState.EMPTY) {
      if (this.selectedTool !== 'hoe') return this.setHint('Hãy chọn công cụ Cuốc đất để xới ô này.');
      return this.hoePlot(plot);
    }
    if (plot.state === PlotState.TILLED) {
      if (this.selectedTool !== 'seed') return this.setHint('Hãy chọn công cụ Gieo hạt để trồng cây.');
      return this.seedPlot(plot);
    }
    if (plot.state === PlotState.SEEDED) {
      if (this.selectedTool !== 'water') return this.setHint('Hãy chọn công cụ Tưới nước cho cây non.');
      return this.waterPlot(plot);
    }
    if (plot.state === PlotState.WATERED) return this.showGrowth(plot);
    if (plot.state === PlotState.READY) {
      if (this.selectedTool !== 'harvest') return this.setHint('Hãy chọn công cụ Thu hoạch để lấy nông sản.');
      return this.harvestPlot(plot);
    }
    return null;
  }

  hoePlot(plot) {
    this.showPlayerToolPose('player_tool_hoe');
    plot.state = PlotState.TILLED;
    plot.tile.setTexture('tilled');
    recordQuestProgress(this.questState, 'tilledPlots', 1);
    this.gainSkillExp('till');
    this.persistGameState();
    return this.setHint('Đã cuốc đất. Chọn hạt trong balo rồi bấm ô này để gieo.');
  }

  seedPlot(plot) {
    if (!this.selectedItem.startsWith('seed_')) {
      this.togglePanel('inventory');
      return this.setHint('Hãy chọn một loại hạt giống trong túi đồ.');
    }
    const cropKey = this.selectedItem.replace('seed_', '');
    if (this.inventory[this.selectedItem] <= 0) {
      this.togglePanel('shop');
      return this.setHint(`Bạn đã hết hạt ${CropTypes[cropKey].name}. Hãy mua thêm trong shop.`);
    }
    this.showPlayerToolPose('player_tool_idle');
    this.inventory[this.selectedItem] -= 1;
    plot.state = PlotState.SEEDED;
    plot.cropType = cropKey;
    plot.wateredAt = 0;
    plot.plant = this.add.image(plot.col * TILE_SIZE, plot.row * TILE_SIZE, `${plot.cropType}_sprout`).setOrigin(0);
    this.gainSkillExp('plant');
    this.refreshHud();
    this.persistGameState();
    return this.setHint(`Đã gieo cây ${CropTypes[plot.cropType].name}. Bấm lại ô này để tưới nước.`);
  }

  waterPlot(plot) {
    this.showPlayerToolPose('player_tool_water');
    plot.state = PlotState.WATERED;
    plot.wateredAt = this.time.now;
    plot.tile.setTexture('wateredSoil');
    this.gainSkillExp('water');
    this.persistGameState();
    return this.setHint(`Đã tưới nước. Cây ${CropTypes[plot.cropType].name} sẽ lớn trong ${this.formatDuration(CropTypes[plot.cropType].duration)}.`);
  }

  showGrowth(plot) {
    const crop = CropTypes[plot.cropType];
    const remaining = Math.max(0, Math.ceil((crop.duration - (this.time.now - plot.wateredAt)) / 1000));
    return this.setHint(`Cây ${crop.name} đang phát triển. Còn khoảng ${remaining}s.`);
  }

  harvestPlot(plot) {
    this.showPlayerToolPose('player_tool_axe');
    this.inventory[`crop_${plot.cropType}`] += 1;
    if (plot.cropType === 'white') recordQuestProgress(this.questState, 'carrots', 1);
    if (plot.cropType === 'green') recordQuestProgress(this.questState, 'turnips', 1);
    this.gainSkillExp('harvest');
    plot.state = PlotState.EMPTY;
    plot.tile.setTexture('soil');
    plot.plant.destroy();
    plot.plant = null;
    plot.cropType = null;
    plot.wateredAt = 0;
    this.refreshHud();
    this.persistGameState();
    return this.setHint('Đã thu hoạch một nông sản.');
  }

  growCrops() {
    this.plots.forEach((plot) => {
      if (plot.state !== PlotState.WATERED) return;
      const crop = CropTypes[plot.cropType];
      const age = this.time.now - plot.wateredAt;
      if (age >= crop.duration) {
        plot.state = PlotState.READY;
        plot.plant.setTexture(`${plot.cropType}_ready`);
      } else if (age >= crop.duration / 2) {
        plot.plant.setTexture(`${plot.cropType}_plant`);
      }
    });
  }

  createWeatherEffects() {
    this.weatherParticles = [];
    this.weatherOverlay = this.fixed(this.add.rectangle(0, 0, VIEW_WIDTH, VIEW_HEIGHT, 0x000000, 0).setOrigin(0));
    this.weatherOverlay.setDepth(900);
    this.refreshWeatherEffects();
  }

  refreshWeatherEffects() {
    if (!this.weatherParticles) return;
    this.weatherParticles.forEach((particle) => particle.destroy());
    this.weatherParticles = [];
    if (this.weatherOverlay) this.weatherOverlay.setFillStyle(0x000000, 0);

    const weather = this.worldState.weather;
    if (weather === 'drizzle' || weather === 'storm') {
      const count = weather === 'storm' ? 90 : 48;
      for (let i = 0; i < count; i += 1) {
        const drop = this.fixed(this.add.rectangle(
          Phaser.Math.Between(0, VIEW_WIDTH),
          Phaser.Math.Between(0, VIEW_HEIGHT),
          weather === 'storm' ? 2 : 1,
          weather === 'storm' ? 16 : 10,
          0x9dd4ff,
          weather === 'storm' ? 0.75 : 0.45,
        ));
        drop.setDepth(901);
        drop.speed = Phaser.Math.Between(weather === 'storm' ? 420 : 220, weather === 'storm' ? 620 : 360);
        this.weatherParticles.push(drop);
      }
      this.weatherOverlay.setFillStyle(0x1d2b45, weather === 'storm' ? 0.18 : 0.08);
    } else if (weather === 'snow') {
      for (let i = 0; i < 55; i += 1) {
        const flake = this.fixed(this.add.rectangle(
          Phaser.Math.Between(0, VIEW_WIDTH),
          Phaser.Math.Between(0, VIEW_HEIGHT),
          3,
          3,
          0xffffff,
          0.72,
        ));
        flake.setDepth(901);
        flake.speed = Phaser.Math.Between(35, 90);
        flake.drift = Phaser.Math.FloatBetween(-18, 18);
        this.weatherParticles.push(flake);
      }
      this.weatherOverlay.setFillStyle(0xbfd8ff, 0.12);
    } else if (weather === 'fog') {
      this.weatherOverlay.setFillStyle(0xd7e6df, 0.32);
    } else if (weather === 'rainbow') {
      [0xff6b6b, 0xffd46b, 0x7cc957, 0x75c9ed, 0x9b8bd3].forEach((color, index) => {
        const band = this.fixed(this.add.rectangle(500 + index * 10, 42 + index * 8, 210, 6, color, 0.35).setAngle(-18));
        band.setDepth(901);
        this.weatherParticles.push(band);
      });
    }
  }

  updateWeatherEffects() {
    if (!this.weatherParticles?.length) return;
    const deltaSeconds = this.game.loop.delta / 1000;
    this.weatherParticles.forEach((particle) => {
      if (!particle.speed) return;
      particle.y += particle.speed * deltaSeconds;
      if (particle.drift) particle.x += particle.drift * deltaSeconds;
      if (particle.y > VIEW_HEIGHT + 20) {
        particle.y = -20;
        particle.x = Phaser.Math.Between(0, VIEW_WIDTH);
      }
    });
  }

  sleepToNextDay() {
    advanceDay(this.worldState);
    const unlockOrder = ['MAP_02', 'MAP_03', 'MAP_04', 'MAP_05', 'MAP_06', 'MAP_07'];
    const unlockIndex = Math.min(unlockOrder.length - 1, Math.floor(this.worldState.day / 2) - 1);
    if (unlockIndex >= 0) unlockMap(this.mapState, unlockOrder[unlockIndex]);
    this.gameState.player.day = this.worldState.day;
    this.gameState.player.season = this.worldState.season;
    this.gameState.player.energy = 100;
    this.persistGameState();
    const weather = getWeatherInfo(this.worldState);
    this.refreshWeatherEffects();
    this.setHint(`Ngay moi: ${weather.seasonName}, thoi tiet ${weather.weatherName}. ${weather.effect}`);
    this.refreshHud();
  }

  persistGameState() {
    this.gameState.player.money = this.money;
    this.gameState.inventory = this.inventory;
    this.gameState.chest = this.chest;
    this.gameState.story = this.storyState;
    this.gameState.npcs = this.npcState;
    this.gameState.world = this.worldState;
    this.gameState.quests = this.questState;
    this.gameState.maps = this.mapState;
    this.gameState.decorations = this.decorationState;
    saveGame(this.gameState);
  }

  gainSkillExp(action) {
    const result = addSkillExp(this.gameState.player, action);
    if (result?.leveledUp) {
      this.setHint(`${result.skill} da len Lv ${result.level}!`);
    }
    this.persistGameState();
  }

  nextRumor() {
    this.setHint(`Tin don moi: ${advanceRumor(this.storyState)}`);
    this.persistGameState();
    this.refreshHud();
  }

  findJournalPage() {
    const result = findJournalPage(this.storyState);
    this.setHint(result.message);
    this.persistGameState();
    return this.refreshHud();
  }

  increaseReputation(amount, message = null) {
    increaseReputation(this.storyState, amount);
    if (message) this.setHint(`${message} Danh tieng +${amount}.`);
    this.persistGameState();
    this.refreshHud();
  }

  updateStoryPanel() {
    if (!this.storyText) return;
    this.storyText.setText(getStoryPanelLines(this.storyState));
  }

  nextGameSystem() {
    nextSystem(this.systemCatalogState);
    this.updateSystemCatalogPanel();
  }

  previousGameSystem() {
    previousSystem(this.systemCatalogState);
    this.updateSystemCatalogPanel();
  }

  updateSystemCatalogPanel() {
    if (!this.systemCatalogText) return;
    const view = getSystemCatalogView(this.systemCatalogState);
    this.systemCatalogText.setText(view.lines);
    this.updateSystemCatalogScrollbar(view);
  }

  scrollGameSystems(deltaLines) {
    const view = scrollSystemCatalog(this.systemCatalogState, deltaLines);
    if (this.systemCatalogText) this.systemCatalogText.setText(view.lines);
    this.updateSystemCatalogScrollbar(view);
  }

  updateSystemCatalogScrollbar(view) {
    if (!this.systemScrollThumb || !this.systemScrollTrack) return;
    const trackTop = this.systemScrollTrack.y - this.systemScrollTrack.displayHeight / 2;
    const trackHeight = this.systemScrollTrack.displayHeight;
    const thumbHeight = view.maxScroll === 0 ? trackHeight : Math.max(28, trackHeight * (view.visibleLines / view.totalLines));
    const travel = Math.max(0, trackHeight - thumbHeight);
    const progress = view.maxScroll === 0 ? 0 : view.scrollLine / view.maxScroll;
    this.systemScrollThumb.setDisplaySize(this.systemScrollThumb.displayWidth, thumbHeight);
    this.systemScrollThumb.y = trackTop + thumbHeight / 2 + travel * progress;
  }

  updateQuestJournalPanel() {
    if (!this.questJournalText) return;
    const quest = getQuestJournalView(this.questState);
    const taskLines = quest.tasks.map((task) => {
      const current = Math.min(task.current, task.target);
      return `- ${task.label}: ${current}/${task.target}`;
    });
    this.questJournalText.setText([
      quest.title,
      `NPC dan dat: ${quest.guideNpc}`,
      '',
      quest.objective,
      '',
      'Tien do:',
      ...taskLines,
      '',
      `Phan thuong: ${quest.rewards.join(', ')}`,
      quest.completed ? 'Trang thai: Da du dieu kien hoan thanh.' : 'Trang thai: Dang thuc hien.',
    ]);
  }

  updateMapPanel() {
    if (!this.mapPanelText) return;
    const currentMap = getCurrentMap(this.mapState);
    const unlockedMaps = getUnlockedMaps(this.mapState);
    this.mapPanelText.setText([
      `Dang o: ${currentMap.name}`,
      '',
      'Ban do da mo:',
      ...unlockedMaps.map((map, index) => `${index + 1}. ${map.name} (${map.size.cols}x${map.size.rows}) - ${map.features.join(', ')}`),
      '',
      'Bam phim 1-7 de di nhanh den ban do da mo.',
      'Tam thoi: bam Ngu de mo thu map tiep theo theo tien trinh.',
    ]);
  }

  updateWeatherPanel() {
    if (!this.weatherPanelText) return;
    const weather = getWeatherInfo(this.worldState);
    this.weatherPanelText.setText([
      `Today: Day ${this.worldState.day} - ${weather.seasonName}`,
      `Weather: ${weather.weatherName}`,
      '',
      `Effect: ${weather.effect}`,
      '',
      '7-day forecast:',
      ...weather.forecast.map((entry) => `Day ${entry.day}: ${entry.weather}`),
      '',
      'Sources: TV 3 days, Ba Linh forecast, Farmer Almanac 7 days.',
    ]);
  }

  getToolUpgradeRows() {
    return getToolUpgradeRows(this.gameState, this.inventory, this.money);
  }

  upgradeSelectedTool(toolId) {
    const result = upgradeTool(this.gameState, this.inventory, this.money, toolId);
    this.money = result.money;
    this.persistGameState();
    this.setHint(result.message);
    this.refreshHud();
  }

  updateToolUpgradePanel() {
    if (!this.toolUpgradeRows || !this.toolUpgradeHint) return;
    this.toolUpgradeHint.setText('Can tien, Quang Sat va tim voi Anh Minh de nang cap dung cu. Bam U de mo/tat panel nay.');
    this.getToolUpgradeRows().forEach((tool) => {
      const row = this.toolUpgradeRows[tool.id];
      if (!row) return;
      const reqText = tool.maxed
        ? 'MAX'
        : `$${tool.requirement.money}, Quang Sat ${tool.requirement.materialCount}, Anh Minh ${tool.requirement.friendship} tim`;
      row.label.setText(`${tool.name} cap ${tool.level} -> ${tool.maxed ? 'toi da' : `cap ${tool.level + 1}`} | ${reqText}`);
      row.bg.setFillStyle(tool.canUpgrade ? 0xffe8b5 : 0xd9aa67);
      row.button.bg.setFillStyle(tool.canUpgrade ? 0x4b6f3b : 0x6f4428);
    });
  }

  renamePlayer() {
    const nextName = window.prompt('Nhap ten nhan vat:', this.gameState.player.name);
    if (!nextName?.trim()) return;
    this.gameState.player.name = nextName.trim().slice(0, 18);
    this.persistGameState();
    this.setHint(`Ten nhan vat da doi thanh ${this.gameState.player.name}.`);
    this.refreshHud();
  }

  updatePlayerProfilePanel() {
    if (!this.playerProfileText) return;
    const player = this.gameState.player;
    const skillLines = getSkillRows(player).map((row) => (
      row.maxed ? `- ${row.skill}: Lv ${row.level} MAX` : `- ${row.skill}: Lv ${row.level} (${row.exp}/${row.needed} EXP)`
    ));
    const toolLines = Object.entries(player.tools).map(([name, level]) => `- ${name}: Cap ${level}`);
    this.playerProfileText.setText([
      `Ten: ${player.name}`,
      `Energy: ${player.energy}/100`,
      `Money: ${this.money}`,
      `Day ${this.worldState.day} - ${this.worldState.season}`,
      '',
      'Skills:',
      ...skillLines,
      '',
      'Tools:',
      ...toolLines.slice(0, 4),
    ]);
  }

  updateDecorationPanel() {
    if (!this.decorationPanelText || !this.decorationRows) return;
    const selected = getSelectedDecoration(this.decorationState);
    this.decorationPanelText.setText([
      `Diem tham my: ${getAestheticScore(this.decorationState)}/100`,
      `Dang chon: ${selected.name}`,
      'Bam R de mo panel. Chon mon roi click len map de dat.',
    ]);
    Object.entries(this.decorationRows).forEach(([id, row]) => {
      row.bg.setFillStyle(id === selected.id ? 0xffe2a8 : 0xffe8b5);
    });
  }

  travelToUnlockedMap(index) {
    const unlockedMaps = getUnlockedMaps(this.mapState);
    const map = unlockedMaps[index];
    if (!map) return;
    if (!travelToMap(this.mapState, map.id)) return;
    this.persistGameState();
    this.setHint(`Da di den ${map.name}.`);
    this.scene.restart();
  }

  togglePanel(panelName) {
    this.activePanel = this.activePanel === panelName ? null : panelName;
    Object.entries(this.panelGroups).forEach(([name, group]) => {
      group.setVisible(name === this.activePanel);
    });
    this.refreshHud();
  }

  selectTool(tool) {
    this.selectedTool = tool;
    this.togglePanel(null);
    this.setHint(`Đã chọn công cụ ${this.getToolName(tool)}.`);
    this.refreshHud();
  }

  selectItem(itemKey) {
    this.selectedItem = itemKey;
    if (itemKey.startsWith('seed_')) {
      this.selectedCrop = itemKey.replace('seed_', '');
    }
    this.togglePanel(null);
    this.setHint(`Đã chọn ${this.itemLabel(itemKey)}.`);
    this.refreshHud();
  }

  buySeed(cropKey = this.selectedCrop) {
    if (this.money < 4) return this.setHint('Không đủ tiền.');
    this.money -= 4;
    this.inventory[`seed_${cropKey}`] += 1;
    this.selectedCrop = cropKey;
    this.selectedItem = `seed_${cropKey}`;
    this.persistGameState();
    this.refreshHud();
    return this.setHint(`Đã mua một hạt ${CropTypes[cropKey].name}.`);
  }

  sellSelectedItem() {
    if (!this.selectedItem.startsWith('crop_')) {
      this.togglePanel('inventory');
      return this.setHint('Chỉ bán được nông sản. Hãy chọn item nông sản trong túi đồ.');
    }
    if (this.inventory[this.selectedItem] <= 0) return this.setHint('Item này không có trong túi đồ.');
    const cropKey = this.selectedItem.replace('crop_', '');
    this.inventory[this.selectedItem] -= 1;
    this.money += CropTypes[cropKey].price;
    this.persistGameState();
    this.refreshHud();
    return this.setHint(`Đã bán ${CropTypes[cropKey].name} được $${CropTypes[cropKey].price}.`);
  }

  depositSelectedItem() {
    if (this.inventory[this.selectedItem] <= 0) return this.setHint('Không có item này trong túi để cất.');
    this.inventory[this.selectedItem] -= 1;
    this.chest[this.selectedItem] += 1;
    this.refreshHud();
    return this.setHint(`Đã cất ${this.itemLabel(this.selectedItem)} vào rương.`);
  }

  withdrawSelectedItem() {
    if (this.chest[this.selectedItem] <= 0) return this.setHint('Rương không có item này.');
    this.chest[this.selectedItem] -= 1;
    this.inventory[this.selectedItem] += 1;
    this.refreshHud();
    return this.setHint(`Đã lấy ${this.itemLabel(this.selectedItem)} khỏi rương.`);
  }

  refreshHud() {
    const storyHud = getStoryHudLines(this.storyState);
    const weather = getWeatherInfo(this.worldState);
    const questLines = getQuestSummary(this.questState);
    if (this.dateText) this.dateText.setText(`${this.gameState.player.name} | Day ${this.worldState.day} ${weather.seasonName}`);
    this.statsText.setText([
      `Tiền: $${this.money}`,
      `${this.getToolName(this.selectedTool)}`,
      `${this.itemLabel(this.selectedItem)}`,
    ]);

    Object.entries(this.itemRows).forEach(([itemKey, item]) => {
      this.statsText.setText([
        `Tien: $${this.money}  DT: ${storyHud.reputation}`,
        `${this.getToolName(this.selectedTool)} | ${questLines[0]}`,
        `Nhat ky: ${storyHud.journalPagesFound}/${storyHud.journalTotalPages}`,
      ]);
      item.row.setFillStyle(itemKey === this.selectedItem ? 0xffe2a8 : 0xd9aa67);
      item.label.setText(`${this.itemLabel(itemKey)} x${this.inventory[itemKey]}`);
    });
    Object.entries(this.chestRows).forEach(([itemKey, item]) => {
      item.row.setFillStyle(itemKey === this.selectedItem ? 0xffe2a8 : 0xd9aa67);
      item.label.setText(`${this.itemLabel(itemKey)} ${this.inventory[itemKey]}/${this.chest[itemKey]}`);
    });
    Object.entries(this.toolRows).forEach(([tool, row]) => {
      row.setFillStyle(tool === this.selectedTool ? 0xffe2a8 : 0xd9aa67);
    });
    Object.entries(this.shopRows).forEach(([crop, row]) => {
      row.setFillStyle(crop === this.selectedCrop ? 0xffe2a8 : 0xd9aa67);
    });
    Object.values(this.toolbarSlots).forEach((slot) => {
      const active =
        slot.key === this.selectedTool ||
        (slot.key === 'inventory' && this.activePanel === 'inventory') ||
        (slot.key === 'shop' && this.activePanel === 'shop') ||
        (slot.key === 'chest' && this.activePanel === 'chest') ||
        (slot.key === 'quests' && this.activePanel === 'quests') ||
        (slot.key === 'maps' && this.activePanel === 'maps') ||
        (slot.key === 'weather' && this.activePanel === 'weather') ||
        (slot.key === 'story' && this.activePanel === 'story') ||
        (slot.key === 'systems' && this.activePanel === 'systems');
      slot.bg.setFillStyle(active ? 0xffe2a8 : 0xf0d3a0);
    });
    this.updateStoryPanel();
    this.updateSystemCatalogPanel();
    this.updateQuestJournalPanel();
    this.updateMapPanel();
    this.updateWeatherPanel();
    this.updateToolUpgradePanel();
    this.updatePlayerProfilePanel();
    this.updateDecorationPanel();
  }

  itemKeys() {
    return [
      'seed_white',
      'seed_green',
      'seed_blue',
      'crop_white',
      'crop_green',
      'crop_blue',
      'gift_rose',
      'gift_iron_ore',
      'gift_book',
      'gift_candy',
      'gift_mushroom',
    ];
  }

  itemLabel(itemKey) {
    const giftNames = {
      gift_rose: 'Hoa Hong',
      gift_iron_ore: 'Quang Sat',
      gift_book: 'Sach',
      gift_candy: 'Keo',
      gift_mushroom: 'Nam Rung',
    };
    if (giftNames[itemKey]) return giftNames[itemKey];
    const [type, cropKey] = itemKey.split('_');
    const prefix = type === 'seed' ? 'Hạt' : 'Nông sản';
    return `${prefix} ${CropTypes[cropKey].name}`;
  }

  itemIcon(itemKey) {
    if (this.isGiftItem(itemKey)) return 'flower';
    if (itemKey.startsWith('seed_')) return 'seedBag';
    const cropKey = itemKey.replace('crop_', '');
    return `${cropKey}_ready`;
  }

  isGiftItem(itemKey) {
    return itemKey.startsWith('gift_');
  }

  getToolName(tool) {
    const names = {
      hoe: 'Cuốc đất',
      seed: 'Gieo hạt',
      water: 'Tưới nước',
      harvest: 'Thu hoạch',
      decor: 'Trang tri',
    };
    return names[tool] ?? tool;
  }

  formatDuration(ms) {
    if (ms < 60000) return `${ms / 1000}s`;
    return '1 phút';
  }

  setHint(message) {
    this.hintText.setText(message);
  }

  plotId(col, row) {
    return `${col}:${row}`;
  }
}
