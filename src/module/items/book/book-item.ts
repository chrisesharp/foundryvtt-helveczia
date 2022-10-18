import { DocumentModificationOptions } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
import { ItemDataConstructorData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData';
import { BaseUser } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/documents.mjs';
import { HVActor } from '../../actor/actor';
import { BaseItem } from '../base-item';
import { HVItem } from '../item';
import { BookItemData } from '../item-types';

export class BookItem extends BaseItem {
  static DEFAULT_TOKEN = 'icons/svg/book.svg';
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
        spells: item.system.spells.filter((i) => i.id !== itemID),
      };
      item.update({ data: updateData });
      li.slideUp(200, () => item.render(false));
    });
  }

  static async preCreate(data: ItemDataConstructorData, _options: DocumentModificationOptions, _user: BaseUser) {
    mergeObject(
      data,
      {
        img: BookItem.DEFAULT_TOKEN,
      },
      { overwrite: true },
    );
  }

  /** @override */
  static getSheetData(sheetData, item) {
    sheetData.coins = CONFIG.HV.coins;
    sheetData.spells = item.object.system?.spells;
    return sheetData;
  }

  /** @override */
  static async getTags(item: HVItem, _actor: HVActor): Promise<string> {
    const top = `<ol class="tag-list">`;
    const bottom = `</ol>`;
    const itemData = item.data as BookItemData;
    // let bible = '';
    // if (item.name?.includes('Bible')) {
    //   bible = `<li class="tag holy-bible" title="Seek Divine Guidance"><a>guidance</a></li>`;
    // }
    return `
    ${top}
      <li class="tag" title="${game.i18n.localize('HV.Encumbrance')}">${itemData.data.encumbrance ?? 0}</li>
   ${bottom}`;
  }
}
