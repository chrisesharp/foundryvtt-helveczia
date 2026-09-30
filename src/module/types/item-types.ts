interface BaseData {
  name: string;
  description: string;
  [key: string]: any;
}

export type PossessionData = BaseData & {
  cost: {
    value: number;
    coin: string;
  };
  encumbrance: number;
};

export interface PossessionItemData {
  type: 'possession';
  [key: string]: any;
}

export type ContainerData = BaseData & {
  cost: {
    value: number;
    coin: string;
  };
  encumbrance: number;
  capacity: number;
  contents: entry[];
};

export interface ContainerItemData {
  type: 'container';
  [key: string]: any;
}

export type entry = {
  id: string;
  name: string;
};

export type BookData = BaseData & {
  cost: {
    value: number;
    coin: string;
  };
  encumbrance: number;
  spells: entry[];
};

export interface BookItemData {
  type: 'book';
  [key: string]: any;
}

export type SkillData = BaseData & {
  subtype: string;
  ability: string;
  bonus: number;
};

export interface SkillItemData {
  type: 'skill';
  [key: string]: any;
}

export type ArmourData = BaseData & {
  bonus: number;
  shield: boolean;
  encumbrance: number;
};

export interface ArmourItemData {
  type: 'armour';
  [key: string]: any;
}

export type ClassData = BaseData & {
  parentClass: string;
  specialism: boolean;
};

export interface ClassItemData {
  type: 'class';
  [key: string]: any;
}

export type PeopleData = BaseData;

export interface PeopleItemData {
  type: 'people';
  [key: string]: any;
}

export type WeaponData = BaseData & {
  attack: string;
  damage: string;
  critical: {
    range: string;
    multiple: number;
  };
  encumbrance: number;
  bonus: number;
  reload: number;
};

export interface WeaponItemData {
  type: 'weapon';
  [key: string]: any;
}

export type DeedData = BaseData & {
  subtype: string;
  magnitude: number;
};

export interface DeedItemData {
  type: 'deed';
  [key: string]: any;
}

export type SpellData = BaseData & {
  level: number;
  class: string;
  range: string;
  duration: string;
  area: string;
  save: string;
  component: string;
};

export interface SpellItemData {
  type: 'spell';
  [key: string]: any;
}

///////////////////////////////

export type HVItemData =
  | PossessionItemData
  | SkillItemData
  | WeaponItemData
  | ArmourItemData
  | ClassItemData
  | PeopleItemData
  | DeedItemData
  | SpellItemData
  | BookItemData
  | ContainerItemData;
