import { HVActor } from './actor';
import { Logger } from '../logger';
import { HVItem } from './item';
import { HVItemData } from '../types/item-types';
import { HVActorSheet } from '../applications/sheets/actor-sheet';

const log = new Logger();

export abstract class BaseItem {
  static get documentName() {
    return '';
  }

  /**
   * Called by HVItem in _preCreate()
   * @param data
   * @param options
   * @param user
   */
  static async preCreate(
    _data: DeepPartial<Item['_source']>,
    _options: DocumentModificationContext,
    _user: any,
  ): Promise<void> {
    // overide here
  }

  /**
   * Called by HVItem in _onCreate()
   * @param item
   * @param data
   * @param options
   * @param userId
   */
  static async onCreate(
    _item: HVItem,
    _data: Item['_source'],
    _options: DocumentModificationContext,
    _userId: string,
  ): Promise<void> {}

  /**
   * Allows each item to prepare its data before its rendered.
   * This can be used to add additional information right before rendering.
   */
  static prepareItemData(itemDocument) {
    const itemData = itemDocument;
    if (itemData.effects) {
      for (const effect of itemData.effects) {
        try {
          effect.origin = itemDocument.uuid;
        } catch (err) {
          log.error('prepareItemData() |', err);
        }
      }
    }
    return itemData;
  }

  static augmentOwnedItem(_actor, data) {
    return data;
  }

  /**
   * Allows each item to add data to its own sheet.
   */
  static getSheetData(sheetData, _item) {
    return sheetData;
  }

  /**
   * Allows each item to add data to its owners actorsheet.
   */
  static getActorSheetData(sheetData, _actor) {
    return sheetData;
  }

  /**
   *
   * @param e
   * @param sheet
   */

  static getSkillsBonus(_actor, _itemData) {
    return 0;
  }

  static getSaveBase(_actor, _itemData) {
    return { bravery: 0, deftness: 0, temptation: 0 };
  }

  static getTags(_item: HVItem, _actor: HVActor): Promise<string> {
    return Promise.resolve('');
  }

  static async createChatMessage(_actor: HVActor, _message: string, _data: HVItemData): Promise<void> {
    // overide here
  }

  static onDelete(_actor, _itemData) {}

  static async onUpdate(
    _item: HVItem,
    _changed: DeepPartial<Item['_source']>,
    _options: DocumentModificationContext,
    _userId: string,
  ): Promise<void> {}

  /*************************
   * EVENT HANDLER
   *************************/

  /**
   * Itemtype agnostic handler for creating new items via event.
   */
  static async _onItemAdd(e, sheet) {
    e.preventDefault();
    e.stopPropagation();

    if (!this.documentName) {
      throw new Error(
        'A subclass of the BaseItem must provide an documentName field or implement their own _onItemAdd() method.',
      );
    }

    const itemData = {
      name: this.defaultName,
      type: this.documentName,
      sort: 9000000,
    };

    await this.createNewItem(itemData, sheet);
  }

  /**
   * Itemtype agnostic handler for opening an items sheet via event.
   */
  static _onItemSettings(e, sheet) {
    e.preventDefault();
    e.stopPropagation();

    const data = e.currentTarget.dataset;
    const item = sheet.actor.items.get(data.item);

    if (item) {
      item.sheet.render(true);
    }
  }

  /*************************
   * HELPER FUNCTIONS
   *************************/

  /**
   * Helper function to create a new item.
   * renderSheet parameter determines if the items' sheet should be rendered.
   */
  static async createNewItem(itemData, sheet: HVActorSheet, renderSheet = true) {
    // Create item and render sheet afterwards
    await sheet.actor.createEmbeddedDocuments('Item', [itemData], { renderSheet: renderSheet });
  }

  /**
   * Helper function to determine a new items name.
   * Defaults to the documentName with the first letter capitalized.
   */
  static get defaultName() {
    return this.documentName.charAt(0).toUpperCase() + this.documentName.slice(1);
  }
}
