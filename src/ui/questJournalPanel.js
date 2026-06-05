export function createQuestJournalPanel(scene) {
  const panel = scene.createPanel('quests', 'Quest Journal', 620, 350);
  const { group, x, y } = panel;

  const contentBg = scene.fixed(scene.add.rectangle(x + 24, y + 58, 572, 252, 0xffe8b5).setOrigin(0));
  scene.questJournalText = scene.fixed(scene.add.text(x + 38, y + 70, '', {
    ...scene.textStyle(12, '#3f2a1b', 544),
    lineSpacing: 5,
  }));

  group.addMultiple([contentBg, scene.questJournalText]);
  group.setVisible(false);
  return panel;
}
