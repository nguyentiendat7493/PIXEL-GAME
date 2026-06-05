import { GreenHollowLore } from '../data/greenHollowLore.js';

const MAX_STORY_LINES = 10;

export function createInitialStoryState() {
  return {
    townReputation: 0,
    journalPagesFound: 0,
    currentRumorIndex: 0,
    weeklyQuestIndex: 0,
  };
}

export function advanceRumor(storyState) {
  storyState.currentRumorIndex = (storyState.currentRumorIndex + 1) % GreenHollowLore.rumors.length;
  return GreenHollowLore.rumors[storyState.currentRumorIndex];
}

export function findJournalPage(storyState) {
  if (storyState.journalPagesFound >= GreenHollowLore.journal.pages.length) {
    return {
      found: false,
      message: 'Ban da tim du cac trang nhat ky hien co trong ban nay.',
    };
  }

  storyState.journalPagesFound += 1;
  increaseReputation(storyState, 10);
  return {
    found: true,
    message: 'Mot trang nhat ky cua Guardian doi thu 7 da duoc tim thay. Danh tieng +10.',
  };
}

export function increaseReputation(storyState, amount) {
  storyState.townReputation = Math.min(1000, storyState.townReputation + amount);

  if (storyState.townReputation >= 220) storyState.weeklyQuestIndex = 3;
  else if (storyState.townReputation >= 120) storyState.weeklyQuestIndex = 2;
  else if (storyState.townReputation >= 50) storyState.weeklyQuestIndex = 1;

  return storyState.townReputation;
}

export function getStoryPanelLines(storyState) {
  const foundPages = GreenHollowLore.journal.pages.slice(0, storyState.journalPagesFound);
  const journalText =
    foundPages.length > 0
      ? foundPages[foundPages.length - 1]
      : `Chua tim thay trang nao trong ${GreenHollowLore.journal.totalPages} trang nhat ky that lac.`;
  const weeklyQuest = GreenHollowLore.weeklyQuests[storyState.weeklyQuestIndex];

  const lines = [
    'Thanh Dia Gaia',
    GreenHollowLore.intro,
    'World Tree dang yeu di, con loi nguy cua Shadow King lam ky uc dan lang phai dan.',
    '',
    `Danh tieng thi tran: ${storyState.townReputation}/1000`,
    `Tin don: ${GreenHollowLore.rumors[storyState.currentRumorIndex]}`,
    `Nhiem vu tuan: ${weeklyQuest.npc} - ${weeklyQuest.objective}`,
    `Nhat ky (${storyState.journalPagesFound}/${GreenHollowLore.journal.totalPages}): ${journalText}`,
  ];

  if (lines.length <= MAX_STORY_LINES) return lines;
  return [...lines.slice(0, MAX_STORY_LINES - 1), '...'];
}

export function getStoryHudLines(storyState) {
  return {
    reputation: storyState.townReputation,
    journalPagesFound: storyState.journalPagesFound,
    journalTotalPages: GreenHollowLore.journal.totalPages,
  };
}
