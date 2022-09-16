import { DocumentModificationOptions } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
import {
  ItemDataBaseProperties,
  ItemDataConstructorData,
} from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData';
import { BaseUser } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/documents.mjs';
import { PropertiesToSource } from '@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes';
import { HVActor } from '../actor/actor';
import { Logger } from '../logger';
import { HVItem } from './item';
import { HVItemData } from './item-types';

const log = new Logger();

export abstract class BaseItem {
  static documentName = '';

  /**
   * Called by HVItem in _preCreate()
   * @param data
   * @param options
   * @param userId
   */
  static async preCreate(
    _data: ItemDataConstructorData,
    _options: DocumentModificationOptions,
    _user: BaseUser,
  ): Promise<void> {}

  /**
   * Called by HVItem in _onCreate()
   * @param data
   * @param options
   * @param userId
   */
  static async onCreate(
    _item: HVItem,
    _data: PropertiesToSource<ItemDataBaseProperties>,
    _options: DocumentModificationOptions,
    _userId: string,
  ): Promise<void> {}

  /**
   * Allows each item to prepare its data before its rendered.
   * This can be used to add additional information right before rendering.
   */
  static prepareItemData(itemDocument) {
    const itemData = itemDocument.data;
    if (itemData.effects) {
      itemData.effects.forEach(async (e) => {
        try {
          e.data.origin = itemDocument.uuid;
        } catch (err) {
          log.error('prepareItemData() |', err);
        }
      });
    }
    return itemData;
  }

  static augmentOwnedItem(_actor, data) {
    return data;
  }

  /**
   * Allows every item to register its own listeners for rendered actor sheets.
   * Implements base listeners for adding, configuring and deleting embedded items.
   */
  static activateActorSheetListeners(_html, _sheet) {
    if (!this.documentName) {
      throw new Error(
        'A subclass of the BaseItem must provide an documentName field or implement their own _onItemAdd() method.',
      );
    }
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
   * Allows each item to add listeners to its sheet
   */
  static activateListeners(_html, _item) {
    // Do nothing by default
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

  static async getTags(_item: HVItem, _actor: HVActor): Promise<string> {
    return '';
  }

  static async createChatMessage(_actor: HVActor, _message: string, _data: HVItemData): Promise<void> {}

  static onDelete(_actor, _itemData) {}

  static async onUpdate(
    _item: HVItem,
    _changed: DeepPartial<PropertiesToSource<ItemDataBaseProperties>>,
    _options: DocumentModificationOptions,
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

  /**
   * Itemtype agnostic handler for deleting an item via event.
   */
  static _onItemDelete(e, sheet) {
    e.preventDefault();
    e.stopPropagation();

    const data = e.currentTarget.dataset;
    const item = sheet.actor.items.get(data.item);

    new Dialog(
      {
        title: `${game.i18n.localize('FAx.Dialog.DocumentDelete')} ${item.name}`,
        content: game.i18n.localize('FAx.Dialog.DocumentDeleteText'),
        default: 'submit',
        buttons: {
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize('HV.Cancel'),
            callback: () => null,
          },
          submit: {
            icon: '<i class="fas fa-check"></i>',
            label: game.i18n.localize('HV.Confirm'),
            callback: async () => {
              item.delete();
            },
          },
        },
      },
      {
        classes: ['fatex', 'fatex-dialog'],
      },
    ).render(true);
  }

  /*************************
   * HELPER FUNCTIONS
   *************************/

  /**
   * Helper function to create a new item.
   * renderSheet parameter determines if the items' sheet should be rendered.
   */
  static async createNewItem(itemData, sheet: ActorSheet, renderSheet = true) {
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

  protected static isEditMode(e): boolean {
    const element = jQuery(e.currentTarget);

    return !!element.closest('.fatex-js-edit-mode').length;
  }
}
