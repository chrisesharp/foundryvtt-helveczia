type Ability =
  | any
  | {
      value: number;
      mod: number;
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
        max: number;
      };

  level: number;
  people: string;
  class: string;
  virtue: number;
  experience: number;

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
        articles: [];
        weapons: [];
        armour: [];
      };

  skills: [];
  peoples: [];
  classes: [];
};

// type CharacterData = BaseData | {experience: number};

export interface CharacterActorData {
  type: 'character';
  data: BaseData;
}

export interface NPCActorData {
  type: 'npc';
  data: BaseData;
}

///////////////////////////////

// export type ReferenceItemData = TokenReferenceItemData | ActorReferenceItemData | CombatantReferenceItemData;
export type HVActorData = CharacterActorData | NPCActorData;
