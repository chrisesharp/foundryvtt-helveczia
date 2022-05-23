interface BaseData {
  description: string;
}

type PossessionData = BaseData;

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

type ArmourData = BaseData;

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

type WeaponData = BaseData;

export interface WeaponItemData {
  type: 'weapon';
  data: WeaponData;
}

type DeedData = BaseData;

export interface DeedItemData {
  type: 'deed';
  data: DeedData;
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
  | DeedItemData;
