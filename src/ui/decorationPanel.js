import { decorationItems } from '../systems/decorationSystem.js';

export function createDecorationPanel(scene) {
  const panel = scene.createPanel('decor', 'Decor', 520, 330);
  const { group, x, y } = panel;

  scene.decorationRows = {};
  scene.decorationPanelText = scene.fixed(scene.add.text(x + 28, y + 58, '', scene.textStyle(12, '#3f2a1b', 460)));
  group.add(scene.decorationPanelText);

  decorationItems.forEach((item, index) => {
    const rowY = y + 94 + index * 38;
    const bg = scene.fixed(scene.add.rectangle(x + 28, rowY, 328, 30, 0xffe8b5).setOrigin(0));
    const label = scene.fixed(scene.add.text(x + 40, rowY + 7, `${item.name} +${item.aesthetic}`, scene.textStyle(11, '#3f2a1b', 300)));
    const button = scene.createPanelButton(group, x + 374, rowY, 92, 30, 'Chon', () => scene.selectDecorationItem(item.id));
    group.addMultiple([bg, label, button.bg, button.text]);
    scene.decorationRows[item.id] = { bg, label, button };
  });

  group.setVisible(false);
  return panel;
}
