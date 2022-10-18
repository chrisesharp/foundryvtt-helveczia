import { DocumentModificationOptions } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
import { ItemDataConstructorData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData';
import { BaseUser } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/documents.mjs';
import { HVActor } from '../../actor/actor';
import { BaseItem } from '../base-item';
import { HVItem } from '../item';
import { ArmourItemData } from '../item-types';

export class ArmourItem extends BaseItem {
  static DEFAULT_TOKEN = 'icons/svg/shield.svg';

  static get documentName() {
    return 'armour';
  }

  /**
   * Adds skill specifig actorsheet listeners.
   */
  static activateActorSheetListeners(html, sheet) {
    super.activateActorSheetListeners(html, sheet);
  }

  static async preCreate(data: ItemDataConstructorData, _options: DocumentModificationOptions, _user: BaseUser) {
    mergeObject(
      data,
      {
        img: ArmourItem.DEFAULT_TOKEN,
      },
      { overwrite: true },
    );
  }

  /** @override */
  static getSheetData(sheetData, _item) {
    sheetData.coins = CONFIG.HV.coins;
    return sheetData;
  }

  /** @override */
  static async getTags(item: HVItem, _actor: HVActor): Promise<string> {
    const itemData = item.system as ArmourItemData;
    return `
    <ol class="tag-list">
      <li class="tag" title="${game.i18n.localize('HV.AC')}">+${itemData.data.bonus ?? 0}</li>
      <li class="tag" title="${game.i18n.localize('HV.Encumbrance')}">${itemData.data.encumbrance ?? 0}</li>
    </ol>`;
  }
}
