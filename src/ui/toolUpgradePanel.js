export function createToolUpgradePanel(scene) {
  const panel = scene.createPanel('tools', 'Tool Upgrades', 620, 372);
  const { group, x, y } = panel;

  scene.toolUpgradeRows = {};
  scene.toolUpgradeHint = scene.fixed(scene.add.text(x + 28, y + 58, '', scene.textStyle(12, '#3f2a1b', 540)));
  group.add(scene.toolUpgradeHint);

  scene.getToolUpgradeRows().forEach((tool, index) => {
    const rowY = y + 90 + index * 38;
    const bg = scene.fixed(scene.add.rectangle(x + 28, rowY, 396, 30, 0xffe8b5).setOrigin(0));
    const label = scene.fixed(scene.add.text(x + 40, rowY + 7, '', scene.textStyle(11, '#3f2a1b', 370)));
    const button = scene.createPanelButton(group, x + 442, rowY, 126, 30, 'Nang cap', () => scene.upgradeSelectedTool(tool.id));
    group.addMultiple([bg, label, button.bg, button.text]);
    scene.toolUpgradeRows[tool.id] = { bg, label, button };
  });

  group.setVisible(false);
  return panel;
}
