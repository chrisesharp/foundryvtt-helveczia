import { DocumentModificationOptions } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
import { ItemDataBaseProperties } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData';
import { PropertiesToSource } from '@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes';
import { HVActor } from '../../actor/actor';
import { BaseItem } from '../base-item';
import { HVItem } from '../item';
import { BookItemData } from '../item-types';

export class BookItem extends BaseItem {
  static get documentName() {
    return 'book';
  }

  /**
   * Adds skill specifig actorsheet listeners.
   */
  static activateActorSheetListeners(html, sheet) {
    super.activateActorSheetListeners(html, sheet);

    // Check or uncheck a single box
    // html.find(".helveczia-possession").click((e) => this._onRollSkill.call(this, e, sheet));
  }

  static activateListeners(html, item) {
    // Delete Inventory Item
    html.find('.item-delete').click((ev) => {
      const li = $(ev.currentTarget).parents('.item-entry');
      const itemID = li.data('item-id');
      const updateData = {
        spells: item.data.data.spells.filter((i) => i.id !== itemID),
      };
      item.update({ data: updateData });
      li.slideUp(200, () => item.render(false));
    });
  }

  static async onCreate(
    _item: HVItem,
    _data: PropertiesToSource<ItemDataBaseProperties>,
    _options: DocumentModificationOptions,
    _userId: string,
  ) {
    // console.log('in PossessionItem.onCreate():', item, data, options, userId);
  }

  /** @override */
  static getSheetData(sheetData, item) {
    sheetData.coins = CONFIG.HV.coins;
    sheetData.spells = item.object.data.data?.spells;
    return sheetData;
  }

  /** @override */
  static async getTags(item: HVItem, _actor: HVActor): Promise<string> {
    const itemData = item.data as BookItemData;
    return `
    <ol class="tag-list">
      <li class="tag" title="${game.i18n.localize('HV.Encumbrance')}">${itemData.data.encumbrance ?? 0}</li>
    </ol>`;
  }
}
