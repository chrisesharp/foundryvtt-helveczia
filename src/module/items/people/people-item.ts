import { DocumentModificationOptions } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
import { ItemDataBaseProperties } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData';
import { PropertiesToSource } from '@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes';
import { HVActor } from '../../actor/actor';
import { BaseItem } from '../base-item';
import { HVItem } from '../item';

export class PeopleItem extends BaseItem {
  static races: {
    [key: string]: { onCreate?: (item: HVItem) => void; skillBonus?: (actor: HVActor) => Promise<number> };
  } = {
    German: { skillBonus: PeopleItem.getGermanSkill },
    French: {},
    Italian: {},
    Dutch: {},
    Czech: {},
    English: {},
    Gypsy: {},
    Hungarian: {},
    Jewish: {},
    Cossack: {},
    Polish: {},
    Spanish: {},
    Swedish: {},
  };

  static async getGermanSkill(actor: HVActor): Promise<number> {
    await actor.setFlag('helveczia', 'german-skill', true);
    console.log('german-skill:', actor.getFlag('helveczia', 'german-skill'));
    return Promise.resolve(1);
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

  static async getSkillBonus(actor, itemData) {
    let bonus = 0;
    const func = PeopleItem.races[itemData.name].skillBonus;
    if (func) {
      bonus += await func(actor);
    }
    return bonus;
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
