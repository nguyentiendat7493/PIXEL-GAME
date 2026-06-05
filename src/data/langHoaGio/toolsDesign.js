export const toolsDesign = {
  upgradeLevels: 5,
  basicTools: [
    { id: 'hoe', name: 'Hoe', use: 'Till soil', level1: '1 tile', level5: '3x3 tiles, +50% speed' },
    { id: 'wateringCan', name: 'Watering Can', use: 'Water crops', level1: '1 tile', level5: '5x5 tiles, retains water' },
    { id: 'axe', name: 'Axe', use: 'Chop trees', level1: '3 hits per tree', level5: '1 hit per tree' },
    { id: 'pickaxe', name: 'Pickaxe', use: 'Break rocks', level1: '3 hits per rock', level5: '1 hit per rock, extra item chance' },
    { id: 'fishingRod', name: 'Fishing Rod', use: 'Fishing', level1: 'Common fish', level5: 'Legendary fish chance' },
    { id: 'sickle', name: 'Sickle', use: 'Harvest/clear weeds', level1: '1 plant', level5: '3x3 harvest area' },
    { id: 'sprayer', name: 'Sprayer', use: 'Pest control', level1: '1 tile', level5: '2x2 disease treatment' },
  ],
  specialTools: [
    { name: 'Divine Watering Can', unlock: 'Chapter 2', effect: 'Water 3x3 for 2 days' },
    { name: 'Golden Hoe', unlock: 'Chapter 4', effect: '50% chance to find rare minerals' },
    { name: 'Wind Sickle', unlock: 'Event', effect: 'Collect whole map once per day' },
    { name: 'Legendary Fishing Rod', unlock: 'Chapter 5', effect: 'Can catch Divine Fish' },
  ],
  forgeUpgradeRules: [
    'Lv1 to Lv2: 10 Copper + 500 Gold',
    'Lv2 to Lv3: 10 Iron + 1000 Gold + Anh Minh friendship >= 5',
    'Lv3 to Lv4: 10 Gold + 2000 Gold + Anh Minh friendship >= 7',
    'Lv4 to Lv5: 5 Platinum + 5000 Gold + Anh Minh friendship = 10',
  ],
};
