import { DocumentModificationOptions } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
import { ItemDataConstructorData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData';
import { BaseUser } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/documents.mjs';
import { HVActor } from '../../actor/actor';
import { BaseItem } from '../base-item';
import { HVItem } from '../item';
import { BookItemData } from '../item-types';
const { TextEditor } = foundry.applications.ux;

export class BookItem extends BaseItem {
  static DEFAULT_TOKEN = 'icons/svg/book.svg';
  static get documentName() {
    return 'book';
  }

  static async preCreate(data: ItemDataConstructorData, _options: DocumentModificationOptions, _user: BaseUser) {
    foundry.utils.mergeObject(
      data,
      {
        img: BookItem.DEFAULT_TOKEN,
      },
      { overwrite: true },
    );
  }

  /** @override */
  static async getSheetData(sheetData, itemSheet) {
    sheetData.coins = CONFIG.HV.coins;
    // sheetData.spells = item.object.system?.spells;
    sheetData.spells = [];
    for (const spell of itemSheet.item.system?.spells) {
      sheetData.spells.push({ id: spell.id, link: await TextEditor.enrichHTML(spell.id, { async: true }) });
    }
    return sheetData;
  }

  /** @override */
  static async getTags(item: HVItem, _actor: HVActor): Promise<string> {
    const top = `<ol class="tag-list">`;
    const bottom = `</ol>`;
    const itemData = item.system as BookItemData;
    return `
    ${top}
      <li class="tag" title="${game.i18n.localize('HV.Encumbrance')}">${itemData.encumbrance ?? 0}</li>
   ${bottom}`;
  }
}
