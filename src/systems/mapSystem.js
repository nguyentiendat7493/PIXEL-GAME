import { worldMaps } from '../data/langHoaGio/worldMaps.js';

export function createMapState() {
  return {
    currentMapId: 'MAP_01',
    unlockedMapIds: ['MAP_01'],
  };
}

export function getCurrentMap(mapState) {
  return worldMaps.find((map) => map.id === mapState.currentMapId) ?? worldMaps[0];
}

export function getUnlockedMaps(mapState) {
  return worldMaps.filter((map) => mapState.unlockedMapIds.includes(map.id));
}

export function unlockMap(mapState, mapId) {
  if (!mapState.unlockedMapIds.includes(mapId)) mapState.unlockedMapIds.push(mapId);
}

export function travelToMap(mapState, mapId) {
  if (!mapState.unlockedMapIds.includes(mapId)) return false;
  mapState.currentMapId = mapId;
  return true;
}
