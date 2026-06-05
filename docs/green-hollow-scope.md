# Green Hollow Scope

Green Hollow is planned as a full farming RPG with 26 major systems.

The system definitions live in `src/data/gameSystems/`, one file per feature area.
The registry file `src/data/gameSystems/index.js` exports:

- `gameSystems`: ordered list of all major systems.
- `gameSystemById`: lookup table for UI, save data, quests, and unlock logic.

Implementation rule:

- Data and design lists stay in `src/data`.
- Gameplay state and progression stay in `src/systems`.
- UI panels stay in `src/ui`.
- Phaser scenes should only connect systems together and avoid storing large design data directly.

This keeps the project ready for incremental implementation without turning `GameScene.js` into one giant file.
