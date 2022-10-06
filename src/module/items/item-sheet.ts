import { prepareActiveEffectCategories } from '../effects';
import { HVItem } from './item';
import { BookItemData } from './item-types';

export class HVItemSheet extends ItemSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['helveczia', 'sheet', 'item'],
      width: 450,
      height: 500,
      resizable: true,
      dragDrop: [
        new DragDrop({
          dragSelector: '.item',
          dropSelector: null,
        }),
      ],
    });
  }

  /** @override */
  activateEditor(target, editorOptions, initialContent) {
    // remove some controls to the editor as the space is lacking
    if (target == 'data.description') {
      editorOptions.toolbar = 'styleselect bullist hr table removeFormat save';
    }
    super.activateEditor(target, editorOptions, initialContent);
  }

  /** @ooverride */
  getData() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any = super.getData();

    // enforce data to ensure compatability between 0.7 and 0.8
    data.data = this.object.data.data;

    // Set owner name if possible
    data.isOwnedBy = this.actor ? this.actor.name : false;

    data.isGM = game.user?.isGM;

    // Let every item type manipulate its own sheet data
    data = CONFIG.HV.itemClasses[this.item.type]?.getSheetData(data, this) || data;

    // Let every component manipulate an items' sheet data
    // for (const sheetComponent in CONFIG.HV.sheetComponents.item) {
    //   if (Object.prototype.hasOwnProperty.call(CONFIG.HV.sheetComponents.item, sheetComponent)) {
    //     data = CONFIG.HV.sheetComponents.item[sheetComponent].getSheetData(data, this);
    //   }
    // }

    data.config = CONFIG.HV;
    data.effects = prepareActiveEffectCategories(this.item.effects);

    return data;
  }

  get template() {
    return `systems/helveczia/templates/item/${this.item.data.type}-sheet.hbs`;
  }

  activateListeners(html) {
    super.activateListeners(html);
    if (typeof CONFIG.HV.itemClasses[this.item.type]?.activateListeners === 'function') {
      CONFIG.HV.itemClasses[this.item.type]?.activateListeners(html, this.item);
    }

    for (const sheetComponent in CONFIG.HV.sheetComponents.item) {
      if (Object.prototype.hasOwnProperty.call(CONFIG.HV.sheetComponents.item, sheetComponent)) {
        CONFIG.HV.sheetComponents.item[sheetComponent].activateListeners(html, this);
      }
    }
  }

  /** @override */
  async _onDragStart(event) {
    const div = event.currentTarget;
    // Create drag data
    const dragData = {};
    // const itemId = div.dataset.entityId;

    const itemId = div.dataset.itemId;
    // Owned Items
    if (itemId) {
      let item = game.items?.get(itemId);
      if (!item) {
        for (const packName of CONFIG.HV.spellPacks) {
          const pack = game.packs.get(packName);
          item = ((await pack?.getDocument(itemId)) as StoredDocument<HVItem>) ?? undefined;
          if (item) break;
        }
      }
      dragData['type'] = 'Item';
      dragData['data'] = item?.data;
    }
    // Set data transfer
    event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  }

  /** @override */
  async _onDrop(event) {
    // Try to extract the data
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData('text/plain'));
    } catch (err) {
      return false;
    }
    const actor = this.actor;

    // Handle the drop with a Hooked function
    const allowed = Hooks.call('dropItemSheetData', actor, this, data);
    if (allowed === false) {
      return;
    }
    // Handle different data types
    switch (data.type) {
      case 'Item':
        return this._onDropItem(data);
      default:
        return;
    }
  }

  async _onDropItem(data) {
    if (!this.isEditable) return false;
    const link = (await TextEditor.getContentLink(data)) ?? '';
    const myRe = new RegExp('{(.*?)}', 'g');
    const result = myRe.exec(link);

    const name = result && result.length > 1 ? result[1] : undefined;

    if (name) {
      const spells = duplicate((this.item.data as BookItemData).data.spells);
      spells.push({ id: link, name: name });
      return this.item.update({ data: { spells: spells } });
    }
    return;
  }

  onDropAllow(_actor, data): boolean {
    return data.type === 'Item';
  }
}
