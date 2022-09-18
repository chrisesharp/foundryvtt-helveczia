import { BaseItem } from './items/base-item';
import { BaseComponent } from './components/base';
import { SkillItem } from './items/skill/skill-item';
import { ClassItem } from './items/class/class-item';
import { PeopleItem } from './items/people/people-item';
import { DeedItem } from './items/deed/deed-item';
import { ArmourItem } from './items/armour/armour-item';
import { WeaponItem } from './items/weapon/weapon-item';
import { SpellItem } from './items/spell/spell-item';
import { PossessionItem } from './items/possesion/possession-item';
import { HVActor } from './actor/actor';
import { HVCharacterCreator } from './apps/chargen';
import { BookItem } from './items/book/book-item';

export interface HelvecziaConfig {
  createCardsFor?: (string) => void;
  DEFAULT_TOKEN: string;
  DEFAULT_PARTY: string;
  actorClasses: {
    [key: string]: typeof HVActor;
    [key: number]: typeof HVActor;
  };

  itemClasses: {
    [key: string]: typeof BaseItem;
    [key: number]: typeof BaseItem;
  };

  sheetComponents: {
    actor: {
      [key: string]: typeof BaseComponent;
      [key: number]: typeof BaseComponent;
    };
    item: {
      [key: string]: typeof BaseComponent;
      [key: number]: typeof BaseComponent;
    };
  };

  applications: {
    peoplePicker: HVCharacterCreator | null;
    // classPicker: ClassPicker | null;
  };

  challengeAwards: {
    [key: number]: number;
  };

  showEffects: boolean;
  flipTokens: boolean;

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

  spellPacks: string[];

  coins: {
    [key: string]: string;
  };

  attacks: {
    [key: string]: string;
  };

  icons: {
    [key: string]: string;
  };
}

export const HV: HelvecziaConfig = {
  DEFAULT_TOKEN: 'systems/helveczia/assets/people/male/man_0.png',
  DEFAULT_PARTY: 'systems/helveczia/assets/people/groups/group_0.png',

  showEffects: false,
  flipTokens: false,

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
  },

  sheetComponents: {
    actor: {
      // sortable: Sortable,
      // configuration: Configuration,
    },
    item: {
      // radio: Radio,
      // rangeSlider: RangeSlider,
      // automation: Automation,
    },
  },

  applications: {
    peoplePicker: null,
    // classPicker: ClassPicker,
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
    Normal: 12,
    Hard: 18,
    Heroic: 24,
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

  spellPacks: [
    'helveczia.student-spells-1',
    'helveczia.student-spells-2',
    'helveczia.student-spells-3',
    'helveczia.cleric-spells-1',
    'helveczia.cleric-spells-2',
    'helveczia.cleric-spells-3',
  ],

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
    d4: '/systems/helveczia/assets/dice/d4.svg',
    d6: '/systems/helveczia/assets/dice/d6.svg',
    d8: '/systems/helveczia/assets/dice/d8.svg',
    d10: '/systems/helveczia/assets/dice/d10.svg',
    d12: '/systems/helveczia/assets/dice/d12.svg',
    d20: '/systems/helveczia/assets/dice/d20.svg',
  },
};
