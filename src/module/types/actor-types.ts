import { HVActor } from '../documents/actor';

type Ability =
  | any
  | {
      value: number;
      mod: number;
    };

type Item =
  | any
  | {
      type: string;
    };

type RollTarget = {
  value: number;
  base: number;
  bonus: number;
};

type BaseData = {
  hp:
    | any
    | {
        value: number;
        hd: number;
        max: number;
      };
  ac: number;
  level: number;
  people: string;
  class: string;
  initiative: number;
  virtue: number;
  experience: number;
  maxskills: number;
  wealth:
    | any
    | {
        th: number;
        pf: number;
        gr: number;
      };

  saves:
    | any
    | {
        bravery: RollTarget;
        deftness: RollTarget;
        temptation: RollTarget;
      };

  attack:
    | any
    | {
        melee: RollTarget;
        ranged: RollTarget;
        cc: RollTarget;
      };

  scores:
    | any
    | {
        str: Ability;
        dex: Ability;
        con: Ability;
        int: Ability;
        wis: Ability;
        cha: Ability;
      };

  possessions:
    | any
    | {
        articles: [Item];
        weapons: [Item];
        armour: [Item];
      };

  skills: [Item];
  peoples: [Item];
  classes: [Item];
  deeds: [Item];
  spells: [Item];
  capacity: number;
  [key: string]: any;
};

export interface CharacterActorData {
  type: 'character';
  system: BaseData & {
    npcModBonus: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface NPCActorData {
  type: 'npc';
  system: BaseData & {
    levelBonus: string;
    npcModBonus: number;
    baseAC: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface PartyActorData {
  type: 'party';
  system: BaseData & {
    members: HVActor[];
    [key: string]: any;
  };
  [key: string]: any;
}

///////////////////////////////

export type HVActorData = CharacterActorData | NPCActorData | PartyActorData;
