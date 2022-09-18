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

///////////////////////////////

export type HVActorData = CharacterActorData | NPCActorData;
