import { DocumentModificationOptions } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
import {
  ItemData,
  ItemDataBaseProperties,
} from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData';
import { PropertiesToSource } from '@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes';
import { BaseItem } from '../base-item';
import { HVItem } from '../item';
import { Logger } from '../../logger';
import { HVActor } from '../../actor/actor';
import { Student } from './student';
import { Vagabond } from './vagabond';
import { Fighter } from './fighter';
import { Cleric } from './cleric';
import { ClassItemData } from '../item-types';

const log = new Logger();

type ProfEntry = {
  onCreate: (item: HVItem) => void;
  skillBonus: (actor: HVActor) => number;
  onDelete: (actor: HVActor) => void;
  specialisms?: () => string[];
};

function capitalize(word: string): string {
  return word[0].toUpperCase() + word.slice(1).toLowerCase();
}

export class ClassItem extends BaseItem {
  static professions: {
    [key: string]: ProfEntry;
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
  };

  static get documentName() {
    return 'class';
  }

  static classes(): string[] {
    return Object.keys(ClassItem.professions);
  }

  static findProfession(itemData: ItemData): ProfEntry | undefined {
    const prof = ClassItem.professions[itemData.name];
    if (prof) return prof;
    const parent = capitalize((itemData as ClassItemData).data.parent);
    return ClassItem.professions[parent];
  }

  static specialisms(profession: string): string[] {
    const func = ClassItem.professions[capitalize(profession)]?.specialisms;
    return func ? func() : [];
  }

  static getSkillsBonus(actor, itemData) {
    let bonus = 0;
    const prof = ClassItem.findProfession(itemData);
    const func = prof?.skillBonus;
    if (func) {
      bonus += func(actor);
    }
    log.debug(`PeopleItem.getSkillsBonus() | skill bonus for ${itemData.name} is ${bonus}`);
    return bonus;
  }

  static onDelete(actor, itemData) {
    const prof = ClassItem.findProfession(itemData);
    const func = prof?.onDelete;
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
    _data: PropertiesToSource<ItemDataBaseProperties>,
    _options: DocumentModificationOptions,
    _userId: string,
  ) {
    if (item.parent) {
      const prof = ClassItem.findProfession(item.data);
      const func = prof?.onCreate;
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
