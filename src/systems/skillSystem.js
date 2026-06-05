const MAX_SKILL_LEVEL = 10;

const expRewards = {
  till: { skill: 'farming', amount: 6 },
  plant: { skill: 'farming', amount: 8 },
  water: { skill: 'farming', amount: 5 },
  harvest: { skill: 'farming', amount: 18 },
  talk: { skill: 'foraging', amount: 2 },
  gift: { skill: 'foraging', amount: 3 },
};

export function createSkillExpState() {
  return {
    farming: 0,
    mining: 0,
    fishing: 0,
    combat: 0,
    foraging: 0,
    crafting: 0,
  };
}

export function addSkillExp(player, action) {
  const reward = expRewards[action];
  if (!reward) return null;

  if (!player.skillExp) player.skillExp = createSkillExpState();
  const currentLevel = player.skills[reward.skill] ?? 1;
  if (currentLevel >= MAX_SKILL_LEVEL) return { skill: reward.skill, leveledUp: false, level: currentLevel };

  player.skillExp[reward.skill] += reward.amount;
  const needed = getSkillExpNeeded(currentLevel);
  if (player.skillExp[reward.skill] >= needed) {
    player.skillExp[reward.skill] -= needed;
    player.skills[reward.skill] = Math.min(MAX_SKILL_LEVEL, currentLevel + 1);
    return { skill: reward.skill, leveledUp: true, level: player.skills[reward.skill] };
  }

  return { skill: reward.skill, leveledUp: false, level: currentLevel };
}

export function getSkillExpNeeded(level) {
  return 40 + level * 25;
}

export function getSkillRows(player) {
  if (!player.skillExp) player.skillExp = createSkillExpState();
  return Object.entries(player.skills).map(([skill, level]) => ({
    skill,
    level,
    exp: player.skillExp[skill] ?? 0,
    needed: level >= MAX_SKILL_LEVEL ? 0 : getSkillExpNeeded(level),
    maxed: level >= MAX_SKILL_LEVEL,
  }));
}
