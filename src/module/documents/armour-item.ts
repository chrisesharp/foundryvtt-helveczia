import type { DocumentModificationContext } from '../../types/foundry-types';
import { HVActor } from './actor';
import { BaseItem } from './base-item';
import { HVItem } from '../item';
import { ArmourItemData } from '../../types/item-types';

export class ArmourItem extends BaseItem {
  static DEFAULT_TOKEN = 'icons/svg/shield.svg';

  static get documentName() {
    return 'armour';
  }

  static async preCreate(
    data: DeepPartial<Item['_source']>,
    _options: DocumentModificationContext,
    _user: foundry.documents.BaseUser,
  ) {
    foundry.utils.mergeObject(
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
      <li class="tag" title="${game.i18n.localize('HV.AC')}">+${itemData.bonus ?? 0}</li>
      <li class="tag-weight fas fa-weight-hanging fa-2xs" title="${game.i18n.localize('HV.Encumbrance')}">${
      itemData.encumbrance ?? 0
    }</li>
    </ol>`;
  }
}
