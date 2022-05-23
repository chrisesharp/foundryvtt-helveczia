import { DocumentModificationOptions } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
import { ItemDataBaseProperties } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData';
import { PropertiesToSource } from '@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes';
import { BaseItem } from '../base-item';
import { HVItem } from '../item';
import { Logger } from '../../logger';
import { HVActor } from '../../actor/actor';
import { Student } from './student';
import { Vagabond } from './vagabond';
import { Fighter } from './fighter';
import { Cleric } from './cleric';

const log = new Logger();

export class ClassItem extends BaseItem {
  static professions: {
    [key: string]: {
      onCreate: (item: HVItem) => void;
      skillBonus: (actor: HVActor) => number;
      onDelete: (actor: HVActor) => void;
      specialisms?: () => string[];
    };
  } = {
    Cleric: {
      onCreate: Cleric.onCreate,
      skillBonus: Cleric.getSkillsBonus,
      onDelete: Cleric.cleanup,
    },
    Student: {
      onCreate: Student.onCreate,
      skillBonus: Student.getSkillsBonus,
      onDelete: Student.cleanup,
    },
    Fighter: {
      onCreate: Fighter.onCreate,
      skillBonus: Fighter.getSkillsBonus,
      onDelete: Fighter.cleanup,
      specialisms: Fighter.specialisms,
    },
    Vagabond: {
      onCreate: Vagabond.onCreate,
      skillBonus: Vagabond.getSkillsBonus,
      onDelete: Vagabond.cleanup,
    },
    Soldier: {
      onCreate: Fighter.onCreate,
      skillBonus: Fighter.getSkillsBonus,
      onDelete: Fighter.cleanup,
    },
  };

  static get documentName() {
    return 'class';
  }

  static classes(): string[] {
    return Object.keys(ClassItem.professions);
  }

  static specialisms(profession: string): string[] {
    const key = profession[0].toUpperCase() + profession.slice(1).toLowerCase();
    const func = ClassItem.professions[key]?.specialisms;
    return func ? func() : [];
  }

  static getSkillsBonus(actor, itemData) {
    let bonus = 0;
    const func = ClassItem.professions[itemData.name].skillBonus;
    if (func) {
      bonus += func(actor);
    }
    log.debug(`PeopleItem.getSkillsBonus() | skill bonus for ${itemData.name} is ${bonus}`);
    return bonus;
  }

  static onDelete(actor, itemData) {
    const func = ClassItem.professions[itemData.name].onDelete;
    if (func) {
      func(actor);
    }
  }

  /**
   * Adds skill specifig actorsheet listeners.
   */
  static activateActorSheetListeners(html, sheet) {
    super.activateActorSheetListeners(html, sheet);

    // Check or uncheck a single box
    // html.find(".helveczia-possession").click((e) => this._onRollSkill.call(this, e, sheet));
  }

  static async onCreate(
    item: HVItem,
    data: PropertiesToSource<ItemDataBaseProperties>,
    _options: DocumentModificationOptions,
    _userId: string,
  ) {
    if (item.parent) {
      const func = ClassItem.professions[data.name]?.onCreate;
      if (func) func(item);
    }
  }

  static getSheetData(data, _sheet) {
    const classes = {};
    ClassItem.classes().forEach((name) => {
      classes[name.toLowerCase()] = name;
    });
    data.classes = classes;
    return data;
  }
}
