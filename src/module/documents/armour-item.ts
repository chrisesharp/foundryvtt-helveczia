import { HVActor } from './actor';
import { BaseItem } from './base-item';
import { HVItem } from './item';
import { ArmourData } from '../types/item-types';

export class ArmourItem extends BaseItem {
  static readonly DEFAULT_TOKEN = 'icons/svg/shield.svg';

  static get documentName() {
    return 'armour';
  }

  static async preCreate(data: DeepPartial<Item['_source']>, _options: DocumentModificationContext, _user: any) {
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
    const itemData = item.system as ArmourData;
    return `
    <ol class="tag-list">
      <li class="tag" title="${game.i18n.localize('HV.AC')}">+${itemData.bonus ?? 0}</li>
      <li class="tag-weight" title="${game.i18n.localize(
        'HV.Encumbrance',
      )}"><i class="fas fa-weight-hanging fa-2xs"></i>${itemData.encumbrance ?? 0}</li>
    </ol>`;
  }
}
