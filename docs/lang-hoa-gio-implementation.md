# Lang Hoa Gio Implementation Notes

The attached design has been split into modular data files under `src/data/langHoaGio/`.

Current playable implementation:

- 10 main NPCs are available in `src/data/npcs/greenHollowNpcs.js`.
- NPCs spawn on the map with names.
- Clicking a nearby NPC starts dialogue and increases friendship.
- The large design systems remain as structured data for incremental implementation.

Next implementation candidates:

- Map switching using `worldMaps.js`.
- Weather and forecast system using `weatherDesign.js`.
- Main quest tracker using `storyChapters.js` and `questDesign.js`.
- Gift reactions using `itemsAndGifts.js` plus NPC loved/hated gifts.
- Tool upgrades using `toolsDesign.js`.
