import { HVActor } from '../documents/actor';
import { HVItem } from '../documents/item';

type Ability = { value: number; mod: number };

type RollTarget = {
  value: number;
  base: number;
  bonus: number;
};

type BaseData = {
  hp: { value: number; hd: number; max: number };
  ac: number;
  level: number;
  people: string | undefined;
  class: string | undefined;
  initiative: number;
  virtue: number;
  experience: number;
  maxskills: number;
  wealth: { th: number; pf: number; gr: number };

  saves: { bravery: RollTarget; deftness: RollTarget; temptation: RollTarget };

  attack: { melee: RollTarget; ranged: RollTarget; cc: RollTarget };

  scores: { str: Ability; dex: Ability; con: Ability; int: Ability; wis: Ability; cha: Ability };

  possessions: { articles: HVItem[]; weapons: HVItem[]; armour: HVItem[] };

  skills: HVItem[];
  peoples: HVItem[];
  classes: HVItem[];
  deeds: HVItem[];
  spells: HVItem[][];
  capacity: number;
  specialisms: HVItem[];
  sins: HVItem[];
  virtues: HVItem[];
};

export interface CharacterActorData {
  type: 'character';
  system: BaseData & {
    npcModBonus: number;
  };
}

export interface NPCActorData {
  type: 'npc';
  system: BaseData & {
    levelBonus: string;
    npcModBonus: number;
    baseAC: number;
  };
}

export interface PartyActorData {
  type: 'party';
  system: BaseData & {
    members: HVActor[];
  };
}

///////////////////////////////

export type HVActorData = CharacterActorData | NPCActorData | PartyActorData;
