import Phaser from 'phaser';
import farmSpritesUrl from '../assets/farm-sprites-reference.png';

const playerFrontUrls = [
  new URL('../../assets/characters/player/front/01_player_front_01.png', import.meta.url).href,
  new URL('../../assets/characters/player/front/02_player_front_02.png', import.meta.url).href,
  new URL('../../assets/characters/player/front/03_player_front_03.png', import.meta.url).href,
  new URL('../../assets/characters/player/front/04_player_front_04.png', import.meta.url).href,
  new URL('../../assets/characters/player/front/05_player_front_05.png', import.meta.url).href,
  new URL('../../assets/characters/player/front/06_player_front_06.png', import.meta.url).href,
  new URL('../../assets/characters/player/front/07_player_front_07.png', import.meta.url).href,
];

const playerSideUrls = [
  new URL('../../assets/characters/player/side/08_player_side_01.png', import.meta.url).href,
  new URL('../../assets/characters/player/side/09_player_side_02.png', import.meta.url).href,
  new URL('../../assets/characters/player/side/10_player_side_03.png', import.meta.url).href,
  new URL('../../assets/characters/player/side/11_player_side_04.png', import.meta.url).href,
  new URL('../../assets/characters/player/side/12_player_side_05.png', import.meta.url).href,
  new URL('../../assets/characters/player/side/13_player_side_06.png', import.meta.url).href,
  new URL('../../assets/characters/player/side/14_player_side_07.png', import.meta.url).href,
];

const playerToolUrls = [
  ['player_tool_hoe', new URL('../../assets/characters/player/tools/15_player_hold_hoe.png', import.meta.url).href],
  ['player_tool_pickaxe', new URL('../../assets/characters/player/tools/16_player_hold_pickaxe.png', import.meta.url).href],
  ['player_tool_axe', new URL('../../assets/characters/player/tools/17_player_hold_axe.png', import.meta.url).href],
  ['player_tool_water', new URL('../../assets/characters/player/tools/18_player_watering_can.png', import.meta.url).href],
  ['player_tool_idle', new URL('../../assets/characters/player/tools/19_player_tool_idle.png', import.meta.url).href],
];

const playerExpressionUrls = [
  new URL('../../assets/characters/player/expressions/20_player_head_01.png', import.meta.url).href,
  new URL('../../assets/characters/player/expressions/21_player_head_02.png', import.meta.url).href,
  new URL('../../assets/characters/player/expressions/22_player_head_03.png', import.meta.url).href,
  new URL('../../assets/characters/player/expressions/23_player_head_04.png', import.meta.url).href,
  new URL('../../assets/characters/player/expressions/24_player_head_05.png', import.meta.url).href,
  new URL('../../assets/characters/player/expressions/25_player_head_06.png', import.meta.url).href,
  new URL('../../assets/characters/player/expressions/26_player_head_07.png', import.meta.url).href,
  new URL('../../assets/characters/player/expressions/27_player_head_08.png', import.meta.url).href,
];

const terrainUrls = [
  ['grass', new URL('../../assets/tilesets/ground/grass/tile_001.png', import.meta.url).href],
  ['grassAlt', new URL('../../assets/tilesets/ground/grass/tile_002.png', import.meta.url).href],
  ['grassFlowers', new URL('../../assets/tilesets/ground/grass/tile_012.png', import.meta.url).href],
  ['soil', new URL('../../assets/tilesets/ground/dirt/tile_003.png', import.meta.url).href],
  ['tilled', new URL('../../assets/tilesets/ground/dirt/tile_008.png', import.meta.url).href],
  ['wateredSoil', new URL('../../assets/tilesets/ground/dirt/tile_016.png', import.meta.url).href],
  ['path', new URL('../../assets/tilesets/paths/tile_018.png', import.meta.url).href],
  ['sand', new URL('../../assets/tilesets/ground/sand/tile_007.png', import.meta.url).href],
  ['stoneGround', new URL('../../assets/tilesets/ground/stone/tile_005.png', import.meta.url).href],
  ['water', new URL('../../assets/tilesets/water/tile_060.png', import.meta.url).href],
  ['waterEdge', new URL('../../assets/tilesets/water/tile_059.png', import.meta.url).href],
  ['bridge', new URL('../../assets/tilesets/bridges/tile_019.png', import.meta.url).href],
  ['fence', new URL('../../assets/tilesets/objects/tile_041.png', import.meta.url).href],
  ['tree', new URL('../../assets/tilesets/trees/tile_036.png', import.meta.url).href],
  ['treePine', new URL('../../assets/tilesets/trees/tile_037.png', import.meta.url).href],
  ['bush', new URL('../../assets/tilesets/trees/tile_039.png', import.meta.url).href],
  ['rock', new URL('../../assets/tilesets/decorations/rocks/tile_027.png', import.meta.url).href],
  ['flower', new URL('../../assets/tilesets/decorations/flowers/tile_058.png', import.meta.url).href],
  ['barrel', new URL('../../assets/tilesets/objects/tile_051.png', import.meta.url).href],
  ['stump', new URL('../../assets/tilesets/objects/tile_046.png', import.meta.url).href],
];

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.image('farmSpritesReference', farmSpritesUrl);
    playerFrontUrls.forEach((url, index) => this.load.image(`player_front_${index}`, url));
    playerSideUrls.forEach((url, index) => this.load.image(`player_side_${index}`, url));
    playerToolUrls.forEach(([key, url]) => this.load.image(key, url));
    playerExpressionUrls.forEach((url, index) => this.load.image(`player_expression_${index}`, url));
    terrainUrls.forEach(([key, url]) => this.load.image(key, url));
  }

  create() {
    this.scene.start('GameScene');
  }
}
