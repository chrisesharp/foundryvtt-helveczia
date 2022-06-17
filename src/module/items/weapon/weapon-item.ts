import { DocumentModificationOptions } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
import { ItemDataBaseProperties } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData';
import { PropertiesToSource } from '@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes';
import { HVActor } from '../../actor/actor';
import { BaseItem } from '../base-item';
import { HVItem } from '../item';
import { WeaponItemData } from '../item-types';

export class WeaponItem extends BaseItem {
  static get documentName() {
    return 'weapon';
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
    _item: HVItem,
    _data: PropertiesToSource<ItemDataBaseProperties>,
    _options: DocumentModificationOptions,
    _userId: string,
  ) {
    // console.log('in WeaponItem.onCreate():', item, data, options, userId);
  }

  /** @override */
  static getSheetData(sheetData, _item) {
    sheetData.coins = CONFIG.HV.coins;
    sheetData.attacks = CONFIG.HV.attacks;
    return sheetData;
  }

  /** @override */
  static async getTags(item: HVItem, actor: HVActor): Promise<string> {
    if ((item.data as WeaponItemData).data?.attack) {
      return `
    <ol class="tag-list">
      <li class="tag">${game.i18n.localize(`HV.attack.${(item.data as WeaponItemData).data.attack}.short`)}</li>
      <li class="tag">${await actor.getItemRollMod(item.id ?? '')}</li>
    </ol>`;
    }
    return '';
  }
}
