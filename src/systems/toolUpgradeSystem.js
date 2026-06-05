export const upgradeableTools = [
  { id: 'hoe', name: 'Cuoc', material: 'gift_iron_ore' },
  { id: 'wateringCan', name: 'Binh tuoi', material: 'gift_iron_ore' },
  { id: 'axe', name: 'Riu', material: 'gift_iron_ore' },
  { id: 'pickaxe', name: 'Cuoc chim', material: 'gift_iron_ore' },
  { id: 'fishingRod', name: 'Can cau', material: 'gift_iron_ore' },
  { id: 'sickle', name: 'Liem', material: 'gift_iron_ore' },
];

const upgradeRequirements = {
  1: { money: 500, materialCount: 1, friendship: 0 },
  2: { money: 1000, materialCount: 2, friendship: 4 },
  3: { money: 2000, materialCount: 3, friendship: 7 },
  4: { money: 5000, materialCount: 5, friendship: 10 },
};

export function getToolUpgradeRows(gameState, inventory, money) {
  const anhMinhFriendship = gameState.npcs?.anhMinh?.friendship ?? 0;
  return upgradeableTools.map((tool) => {
    const level = gameState.player.tools[tool.id] ?? 1;
    const requirement = upgradeRequirements[level] ?? null;
    return {
      ...tool,
      level,
      maxed: level >= 5,
      requirement,
      canUpgrade:
        Boolean(requirement) &&
        money >= requirement.money &&
        (inventory[tool.material] ?? 0) >= requirement.materialCount &&
        anhMinhFriendship >= requirement.friendship,
      friendship: anhMinhFriendship,
    };
  });
}

export function upgradeTool(gameState, inventory, money, toolId) {
  const row = getToolUpgradeRows(gameState, inventory, money).find((entry) => entry.id === toolId);
  if (!row) return { ok: false, money, message: 'Khong tim thay dung cu.' };
  if (row.maxed) return { ok: false, money, message: `${row.name} da dat cap toi da.` };
  if (!row.canUpgrade) {
    const req = row.requirement;
    return {
      ok: false,
      money,
      message: `Can ${req.money} vang, ${req.materialCount} Quang Sat, Anh Minh ${req.friendship} tim.`,
    };
  }

  inventory[row.material] -= row.requirement.materialCount;
  gameState.player.tools[toolId] = row.level + 1;
  return {
    ok: true,
    money: money - row.requirement.money,
    message: `${row.name} da nang len cap ${row.level + 1}.`,
  };
}
