import { DocumentModificationOptions } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
import { ItemDataBaseProperties } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData';
import { PropertiesToSource } from '@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes';
import { BaseItem } from '../base-item';
import { HVItem } from '../item';
import { Logger } from '../../logger';
import { HVActor } from '../../actor/actor';

const log = new Logger();

export class ClassItem extends BaseItem {
  static professions: {
    [key: string]: {
      onCreate?: (item: HVItem) => void;
      skillBonus?: (actor: HVActor) => number;
      onDelete?: (actor: HVActor) => void;
    };
  } = {
    Cleric: {},
    Student: {},
    Fighter: { skillBonus: ClassItem.getFighterSkill, onDelete: ClassItem.cleanupFighterSkill },
    Vagabond: { skillBonus: ClassItem.getVagabondSkill, onDelete: ClassItem.cleanupVagabondSkill },
  };

  static get documentName() {
    return 'class';
  }

  static classes(): string[] {
    return Object.keys(ClassItem.professions);
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

  static getFighterSkill(actor: HVActor): number {
    const gainedThirdLevelSkill = actor.data.data.level === 3 || actor.data.data.level === 4;
    const gainedFifthLevelSkill = actor.data.data.level >= 5;
    actor.setFlag('helveczia', 'fighter-third-skill', gainedThirdLevelSkill);
    actor.setFlag('helveczia', 'fighter-fifth-skill', gainedFifthLevelSkill);
    const gainedSkills = [gainedThirdLevelSkill, gainedFifthLevelSkill]
      .map((i) => (i ? 1 : 0))
      .reduce((acc: number, n) => acc + n, 0);
    return gainedSkills;
  }

  static async cleanupFighterSkill(actor: HVActor): Promise<void> {
    actor.setFlag('helveczia', 'fighter-third-skill', false);
    actor.setFlag('helveczia', 'fighter-fifth-skill', false);
  }

  static getVagabondSkill(actor: HVActor): number {
    const gainedSkills = actor.isVagabond();
    actor.setFlag('helveczia', 'vagabond-skill', gainedSkills);
    return gainedSkills ? 4 : 0;
  }

  static async cleanupVagabondSkill(actor: HVActor): Promise<void> {
    actor.setFlag('helveczia', 'vagabond-skill', false);
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
    if (item.parent) return;
    const func = ClassItem.professions[data.name].onCreate;
    if (func) func(item);
  }
}
