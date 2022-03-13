interface BaseData {
  description: string;
}

type PossessionData = BaseData;

export interface PossessionItemData {
  type: 'possession';
  data: PossessionData;
}

type SkillData = BaseData;

export interface SkillItemData {
  type: 'skill';
  data: SkillData;
}

///////////////////////////////

// export type ReferenceItemData = TokenReferenceItemData | ActorReferenceItemData | CombatantReferenceItemData;
export type HVItemData = PossessionItemData | SkillItemData;
