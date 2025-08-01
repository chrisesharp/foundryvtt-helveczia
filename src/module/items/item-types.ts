interface BaseData {
  name: string;
  description: string;
}

type PossessionData = BaseData & {
  cost: {
    value: number;
    coin: string;
  };
  encumbrance: number;
};

export interface PossessionItemData {
  type: 'possession';
  data: PossessionData;
}

type ContainerData = BaseData & {
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
  data: ContainerData;
}

type entry = {
  id: string;
  name: string;
};
type BookData = BaseData & {
  cost: {
    value: number;
    coin: string;
  };
  encumbrance: number;
  spells: entry[];
};

export interface BookItemData {
  type: 'book';
  data: BookData;
}

type SkillData = BaseData & {
  subtype: string;
  ability: string;
  bonus: number;
};

export interface SkillItemData {
  type: 'skill';
  data: SkillData;
}

type ArmourData = BaseData & {
  bonus: number;
  shield: boolean;
  encumbrance: number;
};

export interface ArmourItemData {
  type: 'armour';
  data: ArmourData;
}

type ClassData = BaseData & {
  parent: string;
  specialism: boolean;
};

export interface ClassItemData {
  type: 'class';
  data: ClassData;
}

type PeopleData = BaseData;

export interface PeopleItemData {
  type: 'people';
  data: PeopleData;
}

type WeaponData = BaseData & {
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
  data: WeaponData;
}

type DeedData = BaseData & {
  subtype: string;
  magnitude: number;
};

export interface DeedItemData {
  type: 'deed';
  data: DeedData;
}

type SpellData = BaseData & {
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
  data: SpellData;
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
