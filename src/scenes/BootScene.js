import Phaser from 'phaser';
import farmSpritesUrl from '../assets/farm-sprites-reference.png';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.image('farmSpritesReference', farmSpritesUrl);
  }

  create() {
    this.scene.start('GameScene');
  }
}
