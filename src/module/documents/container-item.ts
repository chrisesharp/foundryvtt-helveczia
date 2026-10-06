import { HVActor } from './actor';
import { BaseItem } from './base-item';
import { HVItem } from './item';
import { ContainerData } from '../types/item-types';
const { TextEditor } = foundry.applications.ux;

export class ContainerItem extends BaseItem {
  static get documentName() {
    return 'container';
  }

  /** @override */
  static async getSheetData(sheetData, itemSheet) {
    sheetData.coins = CONFIG.HV.coins;
    sheetData.contents = [];
    for (const item of itemSheet.item.system?.contents) {
      sheetData.contents.push({ id: item.id, link: await TextEditor.enrichHTML(item.id) });
    }
    return sheetData;
  }

  static async insertItem(container, droppedItem, link) {
    const contents = foundry.utils.duplicate((container.system as ContainerData).contents);
    if (droppedItem.parent) {
      await droppedItem.setFlag('helveczia', 'in-container', container.id);
    }
    contents.push({ id: link, name: droppedItem.name, encumbrance: droppedItem.system.encumbrance });
    return container.update({ system: { contents: contents } });
  }

  /** @override */
  static getTags(item: HVItem, _actor: HVActor): Promise<string> {
    const itemData = item.system as ContainerData;
    return Promise.resolve(`
    <ol class="tag-list">
      <li class="tag-weight" title="${game.i18n.localize(
        'HV.Encumbrance',
      )}"><i class="fas fa-weight-hanging fa-2xs"></i>${itemData.encumbrance ?? 0}</li>
      <li class="tag" title="${game.i18n.localize('HV.items.capacity')}">${itemData.capacity ?? 0}</li>
    </ol>`);
  }
}
