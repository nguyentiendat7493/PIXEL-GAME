export const technicalSpec = {
  target: '60 FPS desktop browser',
  renderer: 'Canvas 2D with requestAnimationFrame',
  save: 'localStorage',
  performance: ['Particle object pooling', 'Chunked rendering for large maps', 'Lazy load sprites by current map'],
  mainStateShape: ['player', 'farm', 'npcs', 'quests', 'world', 'story'],
  npcStateMachine: ['Idle', 'Walk', 'Talk', 'Work', 'Sleep'],
  dayNight: 'Alpha overlay increases from 5 PM to 7 PM; day begins around 5-7 AM',
};
