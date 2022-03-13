import { BaseItem } from './items/base-item';
import { BaseComponent } from './components/base';
import { SkillItem } from './items/skill/skill-item';
import { PossessionItem } from './items/possesion/possession-item';

export interface HelvecziaConfig {
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
}

export const HV: HelvecziaConfig = {
  itemClasses: {
    skill: SkillItem,
    possession: PossessionItem,
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
