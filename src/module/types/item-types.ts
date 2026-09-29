interface BaseData {
  name: string;
  description: string;
  [key: string]: any;
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
  encumbrance: number;
  [key: string]: any;
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
  encumbrance: number;
  capacity: number;
  contents: entry[];
  [key: string]: any;
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
  encumbrance: number;
  spells: entry[];
  [key: string]: any;
}

type SkillData = BaseData & {
  subtype: string;
  ability: string;
  bonus: number;
};

export interface SkillItemData {
  type: 'skill';
  data: SkillData;
  subtype: string;
  ability: string;
  bonus: number;
  [key: string]: any;
}

type ArmourData = BaseData & {
  bonus: number;
  shield: boolean;
  encumbrance: number;
};

export interface ArmourItemData {
  type: 'armour';
  data: ArmourData;
  bonus: number;
  shield: boolean;
  encumbrance: number;
  [key: string]: any;
}

type ClassData = BaseData & {
  parentClass: string;
  specialism: boolean;
};

export interface ClassItemData {
  type: 'class';
  data: ClassData;
  parentClass: string;
  specialism: boolean;
  [key: string]: any;
}

type PeopleData = BaseData;

export interface PeopleItemData {
  type: 'people';
  data: PeopleData;
  [key: string]: any;
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
  attack: string;
  damage: string;
  critical: {
    range: string;
    multiple: number;
  };
  encumbrance: number;
  bonus: number;
  reload: number;
  [key: string]: any;
}

type DeedData = BaseData & {
  subtype: string;
  magnitude: number;
};

export interface DeedItemData {
  type: 'deed';
  data: DeedData;
  subtype: string;
  magnitude: number;
  [key: string]: any;
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
  level: number;
  class: string;
  range: string;
  duration: string;
  area: string;
  save: string;
  component: string;
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
