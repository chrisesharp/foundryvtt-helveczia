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

export interface HelvecziaConfig {
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
    //     templatePicker: TemplateActorPicker | null;
    //     templateSettings: TemplateActorSettings | null;
    //     [key: string]: Application | null;
    //     [key: number]: Application | null;
  };

  global: {
    useMarkdown: boolean;
  };

  showEffects: boolean;
}

export const HV: HelvecziaConfig = {
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
    templateSettings: null,
    templatePicker: null,
  },
  global: {
    useMarkdown: false,
  },
};
