import { HVActor } from './actor';
import { BaseItem } from './base-item';
import { HVItem } from './item';
import { PossessionData } from '../types/item-types';

export class PossessionItem extends BaseItem {
  static get documentName() {
    return 'possession';
  }

  /** @override */
  static getSheetData(sheetData, _item) {
    sheetData.coins = CONFIG.HV.coins;
    return sheetData;
  }

  /** @override */
  static getTags(item: HVItem, _actor: HVActor): Promise<string> {
    const itemData = item.system as PossessionData;
    return Promise.resolve(`
    <ol class="tag-list">
      <li class="tag-weight" title="${game.i18n.localize(
        'HV.Encumbrance',
      )}"><i class="fas fa-weight-hanging fa-2xs"></i>${itemData.encumbrance ?? 0}</li>
    </ol>`);
  }
}
