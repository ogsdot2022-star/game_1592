export enum GamePhase {
  START_SCREEN = 'START_SCREEN',
  TOWN = 'TOWN',
  DUNGEON_SELECT = 'DUNGEON_SELECT',
  DUNGEON_EXPLORE = 'DUNGEON_EXPLORE',
  COMBAT = 'COMBAT',
  GAME_OVER = 'GAME_OVER'
}

export enum SoldierClass {
  PEASANT = '의병 (농민)',
  ARCHER = '궁수',
  SPEARMAN = '창병',
  SWORDSMAN = '환도수'
}

export interface Soldier {
  id: string;
  name: string;
  classType: SoldierClass;
  hp: number;
  maxHp: number;
  stress: number; // 0-100
  attack: number;
  defense: number;
  speed: number;
  xp: number;
  level: number;
  backstory?: string;
}

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  rewardFood: number;
  image: string;
}

export interface GameState {
  day: number;
  food: number;
  gold: number;
  fame: number; // Used for "Rank/Status"
  roster: Soldier[]; // All soldiers available
  party: Soldier[]; // Currently selected for dungeon (max 4)
  phase: GamePhase;
  log: string[];
  dungeonProgress: number; // 0-100%
  currentEnemies: Enemy[];
}

export interface TownBuilding {
  id: string;
  name: string;
  description: string;
  actionName: string;
}

export enum SkillType {
  ATTACK = 'ATTACK',
  DEFEND = 'DEFEND',
  HEAL = 'HEAL'
}

export interface CombatLog {
  text: string;
  type: 'info' | 'player' | 'enemy' | 'crit' | 'miss';
}