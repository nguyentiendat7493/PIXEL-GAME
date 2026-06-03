import Phaser from 'phaser';

const TILE_SIZE = 32;
const VIEW_WIDTH = 900;
const VIEW_HEIGHT = 560;
const MAP_COLS = 36;
const MAP_ROWS = 24;
const TOOLBAR_Y = 496;

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
    this.money = 40;
    this.inventory = {
      seed_white: 4,
      seed_green: 2,
      seed_blue: 1,
      crop_white: 0,
      crop_green: 0,
      crop_blue: 0,
    };
    this.chest = {
      seed_white: 0,
      seed_green: 0,
      seed_blue: 0,
      crop_white: 0,
      crop_green: 0,
      crop_blue: 0,
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
  }

  create() {
    this.createTextures();
    this.createMap();
    this.createPlayer();
    this.createCamera();
    this.createHud();
    this.createControls();

    this.input.on('pointerdown', (pointer) => this.handleWorldClick(pointer));
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.growCrops(),
    });

    this.setHint('Bấm ô đất để làm nông. Mở balo để chọn loại cây muốn trồng.');
  }

  update() {
    this.movePlayer();
  }

  createTextures() {
    this.makeTileTexture('grass', '#78aa55', '#5f914a', 'grass');
    this.makeTileTexture('soil', '#8b5a34', '#6f4026', 'soil');
    this.makeTileTexture('tilled', '#6f4628', '#4c2e1d', 'tilled');
    this.makeTileTexture('wateredSoil', '#594032', '#3e5368', 'watered');
    this.makeTileTexture('path', '#b99461', '#8d6b42', 'path');
    this.makeTileTexture('water', '#4f93bb', '#86d5ef', 'water');
    Object.entries(CropTypes).forEach(([key, crop]) => this.makeCropTextures(key, crop));
    this.makeSeedTexture();
    this.makeVegetableTexture();
    this.makeBackpackTexture();
    this.makeUiIconTextures();
    this.makePlayerTextures();
    this.makeHouseTexture();
    this.makeFenceTexture();
    this.makeTreeTexture();
    this.makeRockTexture();
    this.makeBarrelTexture();
    this.makeFlowerTexture();
    this.makeBushTexture();
    this.makeBlockerTexture();
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
  }

  makeIconTexture(key, draw) {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');
    draw(ctx);
    this.textures.addCanvas(key, canvas);
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
        const texture = isWater ? 'water' : isPath ? 'path' : 'grass';
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
  }

  createBlocker(x, y, width, height) {
    const blocker = this.blockers.create(x + width / 2, y + height / 2, 'blocker');
    blocker.setDisplaySize(width, height);
    blocker.refreshBody();
  }

  createPlayer() {
    this.player = this.physics.add.sprite(96, 128, 'player_down_0');
    this.player.setCollideWorldBounds(true);
    this.player.setSize(20, 18);
    this.player.setOffset(14, 30);
    this.physics.add.collider(this.player, this.blockers);
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
    this.keys = this.input.keyboard.addKeys('W,A,S,D');
  }

  createHud() {
    this.fixed(this.add.rectangle(680, 10, 208, 76, 0x6f4428).setOrigin(0));
    this.fixed(this.add.rectangle(686, 16, 196, 64, 0xf0d3a0).setOrigin(0));
    this.fixed(this.add.text(700, 24, 'Ngày 1  06:00', this.textStyle(15, '#4c2f1d')));
    this.statsText = this.fixed(this.add.text(700, 50, '', this.textStyle(14, '#4c2f1d', 174)));

    this.fixed(this.add.rectangle(176, TOOLBAR_Y - 8, 552, 58, 0x6f4428).setOrigin(0));
    this.fixed(this.add.rectangle(184, TOOLBAR_Y, 536, 42, 0xd9aa67).setOrigin(0));
    [
      ['hoe', 'hoeIcon', () => this.selectTool('hoe')],
      ['seed', 'seedBag', () => this.selectTool('seed')],
      ['water', 'waterIcon', () => this.selectTool('water')],
      ['harvest', 'harvestIcon', () => this.selectTool('harvest')],
      ['inventory', 'backpackIcon', () => this.togglePanel('inventory')],
      ['shop', 'shopIcon', () => this.togglePanel('shop')],
      ['chest', 'chestIcon', () => this.togglePanel('chest')],
      ['sell', 'coinIcon', () => this.sellSelectedItem()],
    ].forEach(([key, icon, onClick], index) => {
      this.toolbarSlots[key] = this.createToolbarSlot(194 + index * 64, TOOLBAR_Y + 4, key, icon, onClick);
    });

    this.hintText = this.fixed(this.add.text(16, 16, '', this.textStyle(14, '#fff2cf', 360)));
    this.createShopPanel();
    this.createInventoryPanel();
    this.createChestPanel();
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

    this.player.setVelocity(vx, vy);
    if (vx !== 0 && vy !== 0) this.player.setVelocity(vx * 0.7071, vy * 0.7071);
    this.updatePlayerAnimation(vx, vy);
  }

  updatePlayerAnimation(vx, vy) {
    const isMoving = vx !== 0 || vy !== 0;
    if (isMoving) {
      if (Math.abs(vx) > Math.abs(vy)) {
        this.lastDirection = vx > 0 ? 'right' : 'left';
      } else {
        this.lastDirection = vy > 0 ? 'down' : 'up';
      }
      if (this.time.now - this.walkFrameTime > 140) {
        this.walkFrame = (this.walkFrame + 1) % 3;
        this.walkFrameTime = this.time.now;
      }
    } else {
      this.walkFrame = 0;
    }
    this.player.setTexture(`player_${this.lastDirection}_${this.walkFrame}`);
  }

  handleWorldClick(pointer) {
    if (this.activePanel || pointer.y >= TOOLBAR_Y - 12) return;

    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const col = Math.floor(worldPoint.x / TILE_SIZE);
    const row = Math.floor(worldPoint.y / TILE_SIZE);
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
    plot.state = PlotState.TILLED;
    plot.tile.setTexture('tilled');
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
    this.inventory[this.selectedItem] -= 1;
    plot.state = PlotState.SEEDED;
    plot.cropType = cropKey;
    plot.wateredAt = 0;
    plot.plant = this.add.image(plot.col * TILE_SIZE, plot.row * TILE_SIZE, `${plot.cropType}_sprout`).setOrigin(0);
    this.refreshHud();
    return this.setHint(`Đã gieo cây ${CropTypes[plot.cropType].name}. Bấm lại ô này để tưới nước.`);
  }

  waterPlot(plot) {
    plot.state = PlotState.WATERED;
    plot.wateredAt = this.time.now;
    plot.tile.setTexture('wateredSoil');
    return this.setHint(`Đã tưới nước. Cây ${CropTypes[plot.cropType].name} sẽ lớn trong ${this.formatDuration(CropTypes[plot.cropType].duration)}.`);
  }

  showGrowth(plot) {
    const crop = CropTypes[plot.cropType];
    const remaining = Math.max(0, Math.ceil((crop.duration - (this.time.now - plot.wateredAt)) / 1000));
    return this.setHint(`Cây ${crop.name} đang phát triển. Còn khoảng ${remaining}s.`);
  }

  harvestPlot(plot) {
    this.inventory[`crop_${plot.cropType}`] += 1;
    plot.state = PlotState.EMPTY;
    plot.tile.setTexture('soil');
    plot.plant.destroy();
    plot.plant = null;
    plot.cropType = null;
    plot.wateredAt = 0;
    this.refreshHud();
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
    this.statsText.setText([
      `Tiền: $${this.money}`,
      `${this.getToolName(this.selectedTool)}`,
      `${this.itemLabel(this.selectedItem)}`,
    ]);

    Object.entries(this.itemRows).forEach(([itemKey, item]) => {
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
        (slot.key === 'chest' && this.activePanel === 'chest');
      slot.bg.setFillStyle(active ? 0xffe2a8 : 0xf0d3a0);
    });
  }

  itemKeys() {
    return ['seed_white', 'seed_green', 'seed_blue', 'crop_white', 'crop_green', 'crop_blue'];
  }

  itemLabel(itemKey) {
    const [type, cropKey] = itemKey.split('_');
    const prefix = type === 'seed' ? 'Hạt' : 'Nông sản';
    return `${prefix} ${CropTypes[cropKey].name}`;
  }

  itemIcon(itemKey) {
    if (itemKey.startsWith('seed_')) return 'seedBag';
    const cropKey = itemKey.replace('crop_', '');
    return `${cropKey}_ready`;
  }

  getToolName(tool) {
    const names = {
      hoe: 'Cuốc đất',
      seed: 'Gieo hạt',
      water: 'Tưới nước',
      harvest: 'Thu hoạch',
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
