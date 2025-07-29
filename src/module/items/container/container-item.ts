import { HVActor } from '../../actor/actor';
import { BaseItem } from '../base-item';
import { HVItem } from '../item';
import { ContainerItemData } from '../item-types';
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
      sheetData.contents.push({ id: item.id, link: await TextEditor.enrichHTML(item.id, { async: true }) });
    }
    return sheetData;
  }

  static async insertItem(container, droppedItem, link) {
    const contents = foundry.utils.duplicate((container.system as ContainerItemData).contents);
    if (droppedItem.parent) {
      await droppedItem.setFlag('helveczia', 'in-container', container.id);
    }
    contents.push({ id: link, name: droppedItem.name, encumbrance: droppedItem.system.encumbrance });
    return container.update({ system: { contents: contents } });
  }

  /** @override */
  static async getTags(item: HVItem, _actor: HVActor): Promise<string> {
    const itemData = item.system as ContainerItemData;
    return `
    <ol class="tag-list">
      <li class="tag-weight fas fa-weight-hanging fa-2xs" title="${game.i18n.localize('HV.Encumbrance')}">${
      itemData.encumbrance ?? 0
    }</li>
      <li class="tag" title="${game.i18n.localize('HV.items.capacity')}">${itemData.capacity ?? 0}</li>
    </ol>`;
  }
}
