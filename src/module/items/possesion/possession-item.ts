import { HVActor } from '../../actor/actor';
import { BaseItem } from '../base-item';
import { HVItem } from '../item';
import { PossessionItemData } from '../item-types';

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
  static async getTags(item: HVItem, _actor: HVActor): Promise<string> {
    const itemData = item.system as PossessionItemData;
    return `
    <ol class="tag-list">
      <li class="tag-weight fas fa-weight-hanging fa-2xs" title="${game.i18n.localize('HV.Encumbrance')}">${
      itemData.encumbrance ?? 0
    }</li>
    </ol>`;
  }
}
