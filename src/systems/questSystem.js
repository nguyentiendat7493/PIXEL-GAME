import { storyChapters } from '../data/langHoaGio/storyChapters.js';

export function createQuestState() {
  return {
    activeChapter: 1,
    completedChapters: [],
    activeTasks: {
      tilledPlots: 0,
      carrots: 0,
      turnips: 0,
    },
  };
}

export function getActiveChapter(questState) {
  return storyChapters.find((chapter) => chapter.chapter === questState.activeChapter) ?? storyChapters[0];
}

export function recordQuestProgress(questState, type, amount = 1) {
  if (!Object.prototype.hasOwnProperty.call(questState.activeTasks, type)) return null;
  questState.activeTasks[type] += amount;
  return getQuestSummary(questState);
}

export function getQuestSummary(questState) {
  const chapter = getActiveChapter(questState);
  return [
    `Chapter ${chapter.chapter}: ${chapter.title}`,
    chapter.objective,
    `Dat da cay: ${questState.activeTasks.tilledPlots}/10`,
    `Ca rot: ${questState.activeTasks.carrots}/50`,
    `Cu cai: ${questState.activeTasks.turnips}/30`,
  ];
}

export function getQuestJournalView(questState) {
  const chapter = getActiveChapter(questState);
  const tasks = [
    {
      label: 'Cay 10 luong dat',
      current: questState.activeTasks.tilledPlots,
      target: 10,
    },
    {
      label: 'Thu hoach 50 Ca rot',
      current: questState.activeTasks.carrots,
      target: 50,
    },
    {
      label: 'Thu hoach 30 Cu cai',
      current: questState.activeTasks.turnips,
      target: 30,
    },
  ];
  const completed = tasks.every((task) => task.current >= task.target);

  return {
    title: `Chapter ${chapter.chapter}: ${chapter.title}`,
    guideNpc: chapter.guideNpc,
    objective: chapter.objective,
    rewards: chapter.rewards,
    tasks,
    completed,
  };
}
