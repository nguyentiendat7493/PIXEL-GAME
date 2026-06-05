export function createWeatherPanel(scene) {
  const panel = scene.createPanel('weather', 'Weather', 520, 318);
  const { group, x, y } = panel;

  const contentBg = scene.fixed(scene.add.rectangle(x + 24, y + 58, 472, 214, 0xffe8b5).setOrigin(0));
  scene.weatherPanelText = scene.fixed(scene.add.text(x + 38, y + 70, '', {
    ...scene.textStyle(12, '#3f2a1b', 444),
    lineSpacing: 5,
  }));

  group.addMultiple([contentBg, scene.weatherPanelText]);
  group.setVisible(false);
  return panel;
}
