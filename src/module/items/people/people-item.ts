import { DocumentModificationOptions } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
import { ItemDataBaseProperties } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData';
import { PropertiesToSource } from '@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes';
import { HVActor } from '../../actor/actor';
import { BaseItem } from '../base-item';
import { HVItem } from '../item';
import { SkillItemData } from '../item-types';

export class PeopleItem extends BaseItem {
  static races: {
    [key: string]: {
      onCreate?: (item: HVItem) => void;
      skillBonus?: (actor: HVActor) => number;
      cleanup?: (actor: HVActor) => void;
    };
  } = {
    German: { skillBonus: PeopleItem.getGermanSkill, cleanup: PeopleItem.cleanupGermanSkill },
    French: { skillBonus: PeopleItem.getDefaultSkill },
    Italian: { skillBonus: PeopleItem.getDefaultSkill },
    Dutch: { skillBonus: PeopleItem.getDefaultSkill },
    Czech: { skillBonus: PeopleItem.getDefaultSkill },
    English: { skillBonus: PeopleItem.getDefaultSkill },
    Gypsy: { skillBonus: PeopleItem.getDefaultSkill },
    Hungarian: { skillBonus: PeopleItem.getDefaultSkill },
    Jewish: { skillBonus: PeopleItem.getDefaultSkill },
    Cossack: { skillBonus: PeopleItem.getDefaultSkill },
    Polish: { skillBonus: PeopleItem.getDefaultSkill },
    Spanish: { skillBonus: PeopleItem.getDefaultSkill },
    Swedish: { skillBonus: PeopleItem.getDefaultSkill },
  };

  static getGermanSkill(actor: HVActor): number {
    actor.setFlag('helveczia', 'german-skill', true);
    return 1;
  }

  static async cleanupGermanSkill(actor: HVActor): Promise<void> {
    actor.setFlag('helveczia', 'german-skill', false);
    const craft = actor.items.find((i) => i.type === 'skill' && (i.data as SkillItemData).data.subtype === 'craft');
    if (craft?.id) {
      actor.setFlag('helveczia', 'german-skill-generated', false);
      await actor.deleteEmbeddedDocuments('Item', [craft.id]);
      await actor.sheet?.render(true);
    }
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
    return bonus;
  }

  static cleanup(actor, itemData) {
    const func = PeopleItem.races[itemData.name].cleanup;
    if (func) {
      func(actor);
    }
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
