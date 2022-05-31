import { BaseItem } from './items/base-item';
import { BaseComponent } from './components/base';
import { SkillItem } from './items/skill/skill-item';
import { ClassItem } from './items/class/class-item';
import { PeopleItem } from './items/people/people-item';
import { DeedItem } from './items/deed/deed-item';
import { ArmourItem } from './items/armour/armour-item';
import { WeaponItem } from './items/weapon/weapon-item';
import { PossessionItem } from './items/possesion/possession-item';
import { HVActor } from './actor/actor';
import { HVCharacterCreator } from './apps/chargen';

export interface HelvecziaConfig {
  DEFAULT_TOKEN: string;
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

  showEffects: boolean;
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

  abilities: string[];

  coins: {
    [key: string]: string;
  };

  icons: {
    [key: string]: string;
  };
}

export const HV: HelvecziaConfig = {
  DEFAULT_TOKEN: 'systems/helveczia/assets/man.png',
  showEffects: false,
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
    esoteric: 'HV.skills.esoteric',
  },

  deedTypes: {
    favour: 'HV.deeds.favour',
    sin: 'HV.deeds.sin',
  },

  abilities: ['str', 'int', 'wis', 'dex', 'con', 'cha'],

  coins: {
    th: 'Th',
    pf: 'Pf',
    gr: 'Gr',
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
