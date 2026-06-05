export function createMapPanel(scene) {
  const panel = scene.createPanel('maps', 'World Map', 560, 330);
  const { group, x, y } = panel;

  scene.mapRows = {};
  scene.mapPanelText = scene.fixed(scene.add.text(x + 28, y + 58, '', scene.textStyle(12, '#3f2a1b', 500)));

  group.add(scene.mapPanelText);
  group.setVisible(false);
  return panel;
}
