import { DocumentModificationOptions } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
import { ItemDataConstructorData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData';
import { BaseUser } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/documents.mjs';
import { HVActor } from '../../actor/actor';
import { BaseItem } from '../base-item';
import { HVItem } from '../item';
import { WeaponItemData } from '../item-types';

export class WeaponItem extends BaseItem {
  static DEFAULT_TOKEN = 'icons/svg/sword.svg';
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

  static async preCreate(data: ItemDataConstructorData, _options: DocumentModificationOptions, _user: BaseUser) {
    mergeObject(
      data,
      {
        img: WeaponItem.DEFAULT_TOKEN,
      },
      { overwrite: true },
    );
  }

  /** @override */
  static getSheetData(sheetData, _item) {
    sheetData.coins = CONFIG.HV.coins;
    sheetData.attacks = CONFIG.HV.attacks;
    return sheetData;
  }

  /** @override */
  static async getTags(item: HVItem, actor: HVActor): Promise<string> {
    const itemData = item.data as WeaponItemData;
    const reload =
      itemData.data.attack === 'ranged'
        ? `<li class="tag" title="${game.i18n.localize('HV.Reload')}">${itemData.data.reload}</li>`
        : '';
    if (itemData.data?.attack) {
      return `
    <ol class="tag-list">
      <li class="tag">${game.i18n.localize(`HV.attack.${itemData.data.attack}.short`)}</li>
      <li class="tag" title="${game.i18n.localize('HV.bonuses')}">${await actor.getItemRollMod(item.id ?? '')}</li>
      <li class="tag" title="${game.i18n.localize('HV.Damage')}">${itemData.data.damage}</li>
      ${reload}
      <li class="tag" title="${game.i18n.localize('HV.Critical')}">${itemData.data.critical.range}+</li>
      <li class="tag" title="${game.i18n.localize('HV.DamageMultiplier')}">x${itemData.data.critical.multiple}</li>
    </ol>`;
    }
    return '';
  }
}
