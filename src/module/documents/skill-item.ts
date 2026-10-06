import { HVActor } from './actor';
import { BaseItem } from './base-item';
import { HVItem } from './item';
import { SkillData } from '../types/item-types';

export class SkillItem extends BaseItem {
  static get documentName() {
    return 'skill';
  }

  static prepareItemData(itemDocument) {
    const data = super.prepareItemData(itemDocument);
    if (itemDocument.isEmbedded && itemDocument.parent instanceof Actor) {
      CONFIG.HV.itemClasses['people']?.augmentOwnedItem(itemDocument.parent, data);
    }
    return data;
  }

  static async getTags(item: HVItem, actor: HVActor): Promise<string> {
    if ((item.system as SkillData).ability.length) {
      return `
    <ol class="tag-list">
      <li class="tag">${game.i18n.localize(`HV.scores.${(item.system as SkillData).ability}.abbr`)}</li>
      <li class="tag">${await actor.getItemRollMod(item.id ?? '')}</li>
    </ol>`;
    }
    return '';
  }

  /** @override */
  static getSheetData(sheetData, _item) {
    sheetData.skillTypes = CONFIG.HV.skillTypes;
    const abilities = {};
    CONFIG.HV.abilities.forEach((a) => {
      abilities[a] = `HV.scores.${a}.long`;
    });
    sheetData.abilities = abilities;
    return sheetData;
  }
}
