import { Utils } from '../../utils/utils';
import { HVItemSheet } from '../item-sheet';
const { fromUuidSync } = foundry.utils;

// const uuidRegex = new RegExp('(?<actorId>Actor\.[a-zA-Z0-9]+)?\.?(?<itemId>Item\.[a-zA-Z0-9]+)');

export class ContainerSheet extends HVItemSheet {
  static DEFAULT_OPTIONS = {
    classes: ['helveczia', 'sheet', 'item'],
    position: {
      width: 450,
      height: 550,
    },
    actions: {
      toggleEffect: this._effectToggle,
      itemDelete: this._removeItem,
    },
    window: {
      resizable: true,
    },
  };
  static PARTS = {
    header: {
      template: 'systems/helveczia/templates/item/partials/container-sheet-header.hbs',
    },
    contents: {
      template: 'systems/helveczia/templates/item/partials/container-sheet-contents.hbs',
    },
    notes: {
      template: 'systems/helveczia/templates/item/partials/item-notes.hbs',
    },
    tabs: {
      template: 'systems/helveczia/templates/item/partials/item-nav.hbs',
    },
    effects: {
      template: 'systems/helveczia/templates/item/partials/item-effects.hbs',
    },
  };

  async _prepareContext(options) {
    const data = await super._prepareContext(options);
    data.usedSlots = this._usedSlots();
    return data;
  }

  _getTabs(parts: any) {
    const tabGroup = 'primary';
    if (!this.tabGroups[tabGroup]) this.tabGroups[tabGroup] = 'contents';
    return super._getTabs(parts);
  }

  static async _removeItem(_event, target) {
    const li = target.closest('.item-entry');
    const itemID = li.dataset.itemId;
    ContainerSheet._removeItemById(this.item, itemID);
  }

  static async _removeItemById(item, linkID) {
    const { actorId, itemId } = Utils.getUuidFromLink(linkID);
    if (actorId) {
      const ownedItem = fromUuidSync(actorId + '.' + itemId);
      if (ownedItem) {
        ownedItem.unsetFlag('helveczia', 'in-container');
      }
    }
    const index = item.system.contents.findIndex((i) => i.id.includes(linkID));
    if (index >= 0) {
      const contents = item.system.contents.slice(0, index).concat(item.system.contents.slice(index + 1));
      const updateData = {
        contents: contents,
      };
      await item.update({ system: updateData });
    }
  }

  onDropAllow(actor, data): boolean {
    if (super.onDropAllow(actor, data)) {
      const droppedItem = fromUuidSync(data.uuid);
      if (CONFIG.HV.containableItems.includes(droppedItem?.type)) {
        const space = parseInt(droppedItem.system.encumbrance) <= this.item.system.capacity - this._usedSlots();
        if (space) return true;
        ui.notifications.warn('HV.items.noSpaceLeft', { localize: true });
      }
    }
    return false;
  }

  _usedSlots(): number {
    return this.item.system.contents.map((i) => parseInt(i.encumbrance)).reduce((acc, n) => acc + n, 0);
  }
}
