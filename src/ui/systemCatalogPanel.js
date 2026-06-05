export function createSystemCatalogPanel(scene) {
  const panel = scene.createPanel('systems', 'Game Systems', 620, 350);
  const { group, x, y } = panel;

  const contentBg = scene.fixed(scene.add.rectangle(x + 54, y + 58, 512, 252, 0xffe8b5).setOrigin(0));
  scene.systemCatalogText = scene.fixed(scene.add.text(x + 68, y + 70, '', {
    ...scene.textStyle(11, '#3f2a1b', 462),
    lineSpacing: 3,
  }));

  const maskShape = scene.fixed(scene.add.graphics());
  maskShape.fillStyle(0xffffff);
  maskShape.fillRect(x + 64, y + 64, 468, 238);
  maskShape.setVisible(false);
  scene.systemCatalogText.setMask(maskShape.createGeometryMask());

  scene.systemScrollTrack = scene.fixed(scene.add.rectangle(x + 548, y + 184, 8, 230, 0xc69255).setOrigin(0.5));
  scene.systemScrollThumb = scene.fixed(scene.add.rectangle(x + 548, y + 84, 8, 48, 0x4b6f3b).setOrigin(0.5));

  const previous = createSidePanelButton(scene, x + 18, y + 162, 28, 56, '<', () => scene.previousGameSystem());
  const next = createSidePanelButton(scene, x + 574, y + 162, 28, 56, '>', () => scene.nextGameSystem());

  group.addMultiple([
    contentBg,
    scene.systemCatalogText,
    scene.systemScrollTrack,
    scene.systemScrollThumb,
    previous.bg,
    previous.text,
    next.bg,
    next.text,
  ]);
  group.setVisible(false);
  return panel;
}

function createSidePanelButton(scene, x, y, width, height, label, onClick) {
  const bg = scene.fixed(scene.add.rectangle(x, y, width, height, 0x4b6f3b).setOrigin(0));
  const text = scene.fixed(scene.add.text(x + width / 2, y + height / 2 - 8, label, scene.textStyle(18, '#ffffff')).setOrigin(0.5, 0));
  bg.setInteractive({ useHandCursor: true });
  bg.on('pointerdown', onClick);
  bg.on('pointerover', () => bg.setFillStyle(0x5d8549));
  bg.on('pointerout', () => bg.setFillStyle(0x4b6f3b));
  return { bg, text };
}
