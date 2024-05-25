import { HVActor } from '../../actor/actor';
import { BaseItem } from '../base-item';
import { HVItem } from '../item';
import { SkillItemData } from '../item-types';

export class SkillItem extends BaseItem {
  static get documentName() {
    return 'skill';
  }

  /**
   * Adds skill specifig actorsheet listeners.
   */
  static activateActorSheetListeners(html, sheet) {
    super.activateActorSheetListeners(html, sheet);

    // Check or uncheck a single box
    html.find('.helveczia-skill').click((e) => this._onRollSkill.call(this, e, sheet));
  }

  static prepareItemData(itemDocument) {
    const data = super.prepareItemData(itemDocument);
    if (itemDocument.isEmbedded && itemDocument.parent instanceof Actor) {
      const extraData = CONFIG.HV.itemClasses['people']?.augmentOwnedItem(itemDocument.parent, data);
      foundry.utils.mergeObject(data, extraData);
    }
    return data;
  }

  static async _onRollSkill(e, sheet) {
    e.preventDefault();

    const dataset = e.currentTarget.dataset;
    const skill = sheet.actor.items.get(dataset.itemId);

    if (skill) {
      // await this.rollSkill(sheet, skill);
    }
  }

  static async getTags(item: HVItem, actor: HVActor): Promise<string> {
    if ((item.system as SkillItemData).ability.length) {
      return `
    <ol class="tag-list">
      <li class="tag">${game.i18n.localize(`HV.scores.${(item.system as SkillItemData).ability}.short`)}</li>
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
