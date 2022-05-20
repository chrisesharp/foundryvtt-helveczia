import { DocumentModificationOptions } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
import { ItemDataBaseProperties } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData';
import { PropertiesToSource } from '@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes';
import { BaseItem } from '../base-item';
import { HVItem } from '../item';
import { Logger } from '../../logger';
import { HVActor } from '../../actor/actor';
import { SkillItemData } from '../item-types';

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
    Student: {
      onCreate: ClassItem.onCreateStudent,
      skillBonus: ClassItem.getStudentSkill,
      onDelete: ClassItem.cleanupStudent,
    },
    Fighter: {
      onCreate: ClassItem.onCreateFighter,
      skillBonus: ClassItem.getFighterSkill,
      onDelete: ClassItem.cleanupFighterSkill,
    },
    Vagabond: {
      skillBonus: ClassItem.getVagabondSkill,
      onDelete: ClassItem.cleanupVagabondSkill,
    },
    Soldier: {
      onCreate: ClassItem.onCreateFighter,
      skillBonus: ClassItem.getFighterSkill,
      onDelete: ClassItem.cleanupFighterSkill,
    },
  };

  static get documentName() {
    return 'class';
  }

  static classes(): string[] {
    return Object.keys(ClassItem.professions);
  }

  static specialisms(profession: string): string[] {
    const specialisms = {
      fighter: ['Soldier', 'Weapon Master', 'Champion', 'Duellist', 'Hussar', 'Sharpshooter'],
    };
    return specialisms[profession];
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

  static async onCreateFighter(item: HVItem): Promise<void> {
    await item.actor?.setFlag('helveczia', 'fighter-class', true);
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
    actor.setFlag('helveczia', 'fighter-class', false);
    actor.setFlag('helveczia', 'fighter-specialism', false);
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

  static async onCreateStudent(item: HVItem): Promise<void> {
    item.actor?.setFlag('helveczia', 'student-skill', true);
  }

  static getStudentSkill(actor: HVActor): number {
    const gainedSkills = actor.isStudent();
    actor.setFlag('helveczia', 'student-skill', gainedSkills);
    return gainedSkills ? 2 : 0;
  }

  static async cleanupStudent(actor: HVActor): Promise<void> {
    actor.setFlag('helveczia', 'student-skill', false);
    const sciences = actor.items.filter(
      (i) => i.type === 'skill' && (i.data as SkillItemData).data.subtype === 'science',
    );
    if (sciences.length > 0) {
      for (const science of sciences) {
        if (science.getFlag('helveczia', 'locked') && science.id) {
          const flag =
            actor.getFlag('helveczia', 'student-skill-generated-1') === science.name
              ? 'student-skill-generated-1'
              : 'student-skill-generated-2';
          await actor.setFlag('helveczia', flag, false);
          await actor.deleteEmbeddedDocuments('Item', [science.id]);
          await actor.sheet?.render(true);
        }
      }
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
