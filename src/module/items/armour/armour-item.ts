import { DocumentModificationOptions } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
import { ItemDataBaseProperties } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData';
import { PropertiesToSource } from '@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes';
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

    // Check or uncheck a single box
    // html.find(".helveczia-possession").click((e) => this._onRollSkill.call(this, e, sheet));
  }

  static async onCreate(
    item: HVItem,
    data: PropertiesToSource<ItemDataBaseProperties>,
    _options: DocumentModificationOptions,
    _userId: string,
  ) {
    mergeObject(
      data,
      {
        img: ArmourItem.DEFAULT_TOKEN,
      },
      { overwrite: true },
    );
    item.data.update(data);
  }

  /** @override */
  static getSheetData(sheetData, _item) {
    sheetData.coins = CONFIG.HV.coins;
    return sheetData;
  }

  /** @override */
  static async getTags(item: HVItem, _actor: HVActor): Promise<string> {
    const itemData = item.data as ArmourItemData;
    return `
    <ol class="tag-list">
      <li class="tag" title="${game.i18n.localize('HV.AC')}">+${itemData.data.bonus ?? 0}</li>
      <li class="tag" title="${game.i18n.localize('HV.Encumbrance')}">${itemData.data.encumbrance ?? 0}</li>
    </ol>`;
  }
}
