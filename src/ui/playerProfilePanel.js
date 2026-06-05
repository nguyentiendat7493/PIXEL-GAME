export function createPlayerProfilePanel(scene) {
  const panel = scene.createPanel('profile', 'Player Profile', 560, 350);
  const { group, x, y } = panel;

  const contentBg = scene.fixed(scene.add.rectangle(x + 24, y + 58, 512, 220, 0xffe8b5).setOrigin(0));
  scene.playerProfileText = scene.fixed(scene.add.text(x + 38, y + 70, '', {
    ...scene.textStyle(12, '#3f2a1b', 484),
    lineSpacing: 5,
  }));

  const rename = scene.createPanelButton(group, x + 38, y + 292, 116, 30, 'Doi ten', () => scene.renamePlayer());
  group.addMultiple([contentBg, scene.playerProfileText, rename.bg, rename.text]);
  group.setVisible(false);
  return panel;
}
