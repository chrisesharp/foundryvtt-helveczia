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
    item: HVItem,
    data: PropertiesToSource<ItemDataBaseProperties>,
    options: DocumentModificationOptions,
    userId: string,
  ) {
    console.log('in SkillItem.onCreate():', item, data, options, userId);
  }

  static async _onRollSkill(e, sheet) {
    e.preventDefault();

    const dataset = e.currentTarget.dataset;
    const skill = sheet.actor.items.get(dataset.itemId);

    if (skill) {
      // await this.rollSkill(sheet, skill);
    }
  }
}
