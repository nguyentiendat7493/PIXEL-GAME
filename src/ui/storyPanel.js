export function createStoryPanel(scene) {
  const panel = scene.createPanel('story', 'Green Hollow', 620, 372);
  const { group, x, y } = panel;

  const contentBg = scene.fixed(scene.add.rectangle(x + 22, y + 58, 576, 224, 0xffe8b5).setOrigin(0));
  const footerBg = scene.fixed(scene.add.rectangle(x + 22, y + 292, 576, 52, 0xd9aa67).setOrigin(0));
  scene.storyText = scene.fixed(scene.add.text(x + 34, y + 70, '', scene.textStyle(12, '#3f2a1b', 548)));

  const nextRumor = scene.createPanelButton(group, x + 44, y + 304, 128, 32, 'Tin don moi', () => scene.nextRumor());
  const findJournal = scene.createPanelButton(group, x + 188, y + 304, 132, 32, 'Tim nhat ky', () => scene.findJournalPage());
  const close = scene.createPanelButton(group, x + 466, y + 304, 104, 32, 'Dong', () => scene.togglePanel(null));

  group.addMultiple([
    contentBg,
    footerBg,
    scene.storyText,
    nextRumor.bg,
    nextRumor.text,
    findJournal.bg,
    findJournal.text,
    close.bg,
    close.text,
  ]);
  group.setVisible(false);
  return panel;
}
