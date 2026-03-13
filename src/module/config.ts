import { BaseItem } from './documents/base-item';
import { SkillItem } from './documents/skill-item';
import { ClassItem } from './documents/class-item';
import { PeopleItem } from './documents/people-item';
import { DeedItem } from './documents/deed-item';
import { ArmourItem } from './documents/armour-item';
import { WeaponItem } from './documents/weapon-item';
import { SpellItem } from './documents/spell-item';
import { ContainerItem } from './documents/container-item';
import { PossessionItem } from './documents/possession-item';
import { HVActor } from './documents/actor';
import { HVCharacterCreator } from './apps/chargen';
import { BookItem } from './documents/book-item';
import { KJVBible } from './apps/bible';

export interface HelvecziaConfig {
  createCardsFor?: (string) => void;
  DEFAULT_TOKEN: string;
  DEFAULT_PARTY: string;
  DEFAULT_ELEVATION: number;
  DEFAULT_SCENE_SCALE: number;

  actorClasses: {
    [key: string]: typeof HVActor;
    [key: number]: typeof HVActor;
  };

  itemClasses: {
    [key: string]: typeof BaseItem;
    [key: number]: typeof BaseItem;
  };

  applications: {
    peoplePicker: HVCharacterCreator | null;
    holyBible: KJVBible | null;
  };

  challengeAwards: {
    [key: number]: number;
  };

  showEffects: boolean;
  flipTokens: boolean;
  depthTokens: boolean;

  XPLevels: {
    [key: number]: number;
  };

  difficulties: {
    [key: string]: number;
  };

  skillTypes: {
    [key: string]: string;
  };

  deedTypes: {
    [key: string]: string;
  };

  virtueMagnitudes: {
    [key: number]: string;
  };

  sinMagnitudes: {
    [key: number]: string;
  };

  cardinalSins: {
    [key: number]: string;
  };

  cardinalVirtues: {
    [key: number]: string;
  };

  magicalClasses: string[];

  abilities: string[];

  saves: string[];

  spellSlots: {
    [key: number]: number[];
  };

  coins: {
    [key: string]: string;
  };

  attacks: {
    [key: string]: string;
  };

  icons: {
    [key: string]: string;
  };

  containableItems: string[];
}

export const HV: HelvecziaConfig = {
  DEFAULT_TOKEN: 'systems/helveczia/assets/people/male/man_0.png',
  DEFAULT_PARTY: 'systems/helveczia/assets/people/groups/group_0.png',
  DEFAULT_ELEVATION: 3,
  DEFAULT_SCENE_SCALE: 0.1,

  showEffects: false,
  flipTokens: false,
  depthTokens: false,

  actorClasses: {
    character: HVActor,
    npc: HVActor,
  },

  itemClasses: {
    skill: SkillItem,
    possession: PossessionItem,
    class: ClassItem,
    people: PeopleItem,
    deed: DeedItem,
    armour: ArmourItem,
    weapon: WeaponItem,
    spell: SpellItem,
    book: BookItem,
    container: ContainerItem,
  },

  applications: {
    peoplePicker: null,
    holyBible: new KJVBible({}),
  },

  challengeAwards: {
    1: 50,
    2: 100,
    3: 150,
    4: 250,
    5: 400,
    6: 650,
    7: 1000,
    8: 1500,
    9: 2000,
    10: 2500,
  },

  XPLevels: {
    6: 30000,
    5: 20000,
    4: 12000,
    3: 6000,
    2: 2000,
    1: 0,
  },

  difficulties: {
    'HV.difficulties.normal': 12,
    'HV.difficulties.hard': 18,
    'HV.difficulties.heroic': 24,
  },

  skillTypes: {
    craft: 'HV.skills.craft',
    science: 'HV.skills.science',
    practical: 'HV.skills.practical',
    vagabond: 'HV.skills.vagabond',
    magical: 'HV.skills.magical',
  },

  magicalClasses: ['cleric', 'student'],

  deedTypes: {
    virtue: 'HV.deeds.virtue',
    sin: 'HV.deeds.sin',
  },

  cardinalSins: {
    0: 'superbia',
    1: 'avaritia',
    2: 'luxuria',
    3: 'invidia',
    4: 'gula',
    5: 'ira',
    6: 'acedia',
  },

  cardinalVirtues: {
    0: 'humilitas',
    1: 'caritas',
    2: 'castitas',
    3: 'benevolentia',
    4: 'temperantia',
    5: 'patientia',
    6: 'industria',
  },

  virtueMagnitudes: {
    1: 'HV.deeds.minor',
    2: 'HV.deeds.moderate',
    3: 'HV.deeds.major',
    6: 'HV.deeds.sincere',
  },

  sinMagnitudes: {
    1: 'HV.deeds.minor',
    2: 'HV.deeds.moderate',
    3: 'HV.deeds.major',
    6: 'HV.deeds.heinous',
  },

  abilities: ['str', 'int', 'wis', 'dex', 'con', 'cha'],

  saves: ['bravery', 'deftness', 'temptation'],

  spellSlots: {
    1: [1, 0, 0],
    2: [2, 0, 0],
    3: [2, 1, 0],
    4: [3, 2, 0],
    5: [3, 2, 1],
    6: [3, 3, 2],
  },

  coins: {
    th: 'Th',
    pf: 'Pf',
    gr: 'Gr',
  },

  attacks: {
    melee: 'HV.Melee',
    ranged: 'HV.Ranged',
  },

  icons: {
    d4: 'systems/helveczia/assets/dice/d4.svg',
    d6: 'systems/helveczia/assets/dice/d6.svg',
    d8: 'systems/helveczia/assets/dice/d8.svg',
    d10: 'systems/helveczia/assets/dice/d10.svg',
    d12: 'systems/helveczia/assets/dice/d12.svg',
    d20: 'systems/helveczia/assets/dice/d20.svg',
  },

  containableItems: ['armour', 'weapon', 'possession', 'book', 'container'],
};
