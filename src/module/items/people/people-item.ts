import { DocumentModificationOptions } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
import { ItemDataBaseProperties } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData';
import { PropertiesToSource } from '@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes';
import { HVActor } from '../../actor/actor';
import { BaseItem } from '../base-item';
import { HVItem } from '../item';
import { SkillItemData } from '../item-types';
import { Logger } from '../../logger';

const log = new Logger();

export class PeopleItem extends BaseItem {
  static races: {
    [key: string]: {
      onCreate?: (item: HVItem) => void;
      skillBonus?: (actor: HVActor) => number;
      onDelete?: (actor: HVActor) => void;
    };
  } = {
    German: { skillBonus: PeopleItem.getGermanSkill, onDelete: PeopleItem.cleanupGermanSkill },
    French: {},
    Italian: {},
    Dutch: {},
    Czech: { skillBonus: PeopleItem.getCzechSkill, onDelete: PeopleItem.cleanupCzechSkill },
    English: {},
    Gypsy: {},
    Hungarian: {},
    Jewish: {},
    Cossack: {},
    Polish: {},
    Spanish: {},
    Swedish: {},
  };

  static getGermanSkill(actor: HVActor): number {
    actor.setFlag('helveczia', 'german-skill', true);
    return 1;
  }

  static async cleanupGermanSkill(actor: HVActor): Promise<void> {
    actor.setFlag('helveczia', 'german-skill', false);
    const crafts = actor.items.filter((i) => i.type === 'skill' && (i.data as SkillItemData).data.subtype === 'craft');
    if (crafts.length > 0) {
      for (const craft of crafts) {
        if (craft.getFlag('helveczia', 'locked') && craft.id) {
          actor.setFlag('helveczia', 'german-skill-generated', false);
          await actor.deleteEmbeddedDocuments('Item', [craft.id]);
          await actor.sheet?.render(true);
        }
      }
    }
  }

  static getCzechSkill(actor: HVActor): number {
    const gainedSkill = actor.data.data.level >= 4 && (actor.isCleric() || actor.isStudent());
    actor.setFlag('helveczia', 'czech-skill', gainedSkill);
    return gainedSkill ? 1 : 0;
  }

  static async cleanupCzechSkill(actor: HVActor): Promise<void> {
    actor.setFlag('helveczia', 'czech-skill', false);
  }

  static getDefaultSkill(_actor: HVActor): number {
    return 0;
  }

  static get documentName() {
    return 'people';
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
    const func = PeopleItem.races[data.name].onCreate;
    if (func) func(item);
  }

  static peoples(): string[] {
    return Object.keys(PeopleItem.races);
  }

  static getSkillBonus(actor, itemData) {
    let bonus = 0;
    const func = PeopleItem.races[itemData.name].skillBonus;
    if (func) {
      bonus += func(actor);
    }
    log.debug(`PeopleItem.getSkillBonus() | skill bonus for ${itemData.name} is ${bonus}`);
    return bonus;
  }

  static onDelete(actor, itemData) {
    const func = PeopleItem.races[itemData.name].onDelete;
    if (func) {
      func(actor);
    }
  }

  static async enableHungarianFate(actor: HVActor): Promise<{ mod: number; attr: string }> {
    if (!actor.getFlag('helveczia', 'fate-invoked')) {
      actor.setFlag('helveczia', 'fate-invoked', true);
      const randomSave = ['bravery', 'deftness', 'temptation'][Math.floor(Math.random() * 3)];
      await actor.setFlag('helveczia', 'fate-save', randomSave);
      ChatMessage.create({
        user: game.user?.id,
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        content: await renderTemplate('systems/helveczia/templates/chat/hungarian-fate.hbs', {
          randomSave: randomSave,
          actor: actor,
        }),
      });
    }
    const attr = (await actor.getFlag('helveczia', 'fate-save')) as string;
    return { mod: -2, attr: attr };
  }

  // static async addFrenchEffects(item: HVItem) {
  //   const armourEffect = { key: 'data.ac', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: '1' };
  //   const deftnessEffect = { key: 'data.saves.deftness.bonus', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: '1' };
  //   const effect = await ActiveEffect.create(
  //     {
  //       label: 'Finesse',
  //       icon: 'icons/svg/aura.svg',
  //       origin: item.uuid,
  //       transfer: true,
  //       changes: [armourEffect, deftnessEffect],
  //     },
  //     { parent: item },
  //   );
  //   if (effect) {
  //     await item.updateEmbeddedDocuments('ActiveEffect', [{ _id: effect.id, effects: [effect] }]);
  //   }
  //   return item.update();
  // }
}
