import { DocumentModificationOptions } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
import { ItemDataBaseProperties } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData';
import { PropertiesToSource } from '@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes';
import { BaseItem } from '../base-item';
import { HVItem } from '../item';

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

  static async onCreate(
    _item: HVItem,
    _data: PropertiesToSource<ItemDataBaseProperties>,
    _options: DocumentModificationOptions,
    _userId: string,
  ) {
    // console.log('in SkillItem.onCreate():', item, data, options, userId);
  }

  static async _onRollSkill(e, sheet) {
    e.preventDefault();

    const dataset = e.currentTarget.dataset;
    const skill = sheet.actor.items.get(dataset.itemId);

    if (skill) {
      // await this.rollSkill(sheet, skill);
    }
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
