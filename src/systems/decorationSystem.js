export const decorationItems = [
  { id: 'flowerPot', name: 'Bon hoa', texture: 'flower', aesthetic: 5, price: 50 },
  { id: 'stoneChair', name: 'Ghe da', texture: 'rock', aesthetic: 8, price: 90 },
  { id: 'lantern', name: 'Den long', texture: 'barrel', aesthetic: 10, price: 120 },
  { id: 'bushDecor', name: 'Bui cay', texture: 'bush', aesthetic: 6, price: 60 },
  { id: 'treeDecor', name: 'Cay trang tri', texture: 'tree', aesthetic: 12, price: 150 },
];

export function createDecorationState() {
  return {
    selectedDecorationId: 'flowerPot',
    placed: [],
  };
}

export function getSelectedDecoration(decorationState) {
  return getDecorationById(decorationState.selectedDecorationId) ?? decorationItems[0];
}

export function getDecorationById(decorationId) {
  return decorationItems.find((item) => item.id === decorationId) ?? null;
}

export function selectDecoration(decorationState, decorationId) {
  if (!decorationItems.some((item) => item.id === decorationId)) return false;
  decorationState.selectedDecorationId = decorationId;
  return true;
}

export function placeDecoration(decorationState, col, row) {
  const item = getSelectedDecoration(decorationState);
  decorationState.placed.push({
    id: item.id,
    col,
    row,
  });
  return item;
}

export function getAestheticScore(decorationState) {
  return decorationState.placed.reduce((total, placed) => {
    const item = decorationItems.find((entry) => entry.id === placed.id);
    return total + (item?.aesthetic ?? 0);
  }, 0);
}
