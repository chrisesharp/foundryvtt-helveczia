interface BaseData {
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

type SpellData = BaseData;

export interface SpellItemData {
  type: 'spell';
  data: SpellData;
}

///////////////////////////////

// export type ReferenceItemData = TokenReferenceItemData | ActorReferenceItemData | CombatantReferenceItemData;
export type HVItemData =
  | PossessionItemData
  | SkillItemData
  | WeaponItemData
  | ArmourItemData
  | ClassItemData
  | PeopleItemData
  | DeedItemData
  | SpellItemData;
