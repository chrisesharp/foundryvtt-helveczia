import { DocumentModificationOptions } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
import { ItemDataBaseProperties } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData';
import { PropertiesToSource } from '@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes';
import { HVActor } from '../actor/actor';
import { HVItemData } from './item-types';

export class HVItem extends Item {
  protected async _onCreate(
    data: PropertiesToSource<ItemDataBaseProperties>,
    options: DocumentModificationOptions,
    userId: string,
  ): Promise<void> {
    // Let every itemType augment itself on creation
    if (CONFIG.HV.itemClasses[this.data.type]) {
      await CONFIG.HV.itemClasses[this.data.type].onCreate(this, data, options, userId);
    }
  }

  prepareData() {
    super.prepareData();

    // Let every itemType prepare itself
    if (this.actor?.data) {
      if (CONFIG.HV.itemClasses[this.data.type]) {
        CONFIG.HV.itemClasses[this.data.type].prepareItemData(this);
      }
    }
  }

  //** @override */
  protected _onDelete(_options: DocumentModificationOptions, _userId: string): void {
    if (this.isEmbedded) {
      CONFIG.HV.itemClasses[this.data.type]?.onDelete(this.actor, this.data);
    }
  }

  //** @override */
  protected _onUpdate(
    changed: DeepPartial<PropertiesToSource<ItemDataBaseProperties>>,
    options: DocumentModificationOptions,
    userId: string,
  ): void {
    if (CONFIG.HV.itemClasses[this.data.type]) {
      CONFIG.HV.itemClasses[this.data.type]?.onUpdate(this, changed, options, userId);
    }
    super._onUpdate(changed, options, userId);
  }

  /** Augment actor skills  */
  getSkillsBonus(actor) {
    return CONFIG.HV.itemClasses[this.data.type]
      ? CONFIG.HV.itemClasses[this.data.type].getSkillsBonus(actor, this.data)
      : 0;
  }

  getSaveBase(actor): { bravery: number; deftness: number; temptation: number } {
    return CONFIG.HV.itemClasses[this.data.type]
      ? CONFIG.HV.itemClasses[this.data.type].getSaveBase(actor, this.data)
      : { bravery: 0, deftness: 0, temptation: 0 };
  }

  async createChatMessage(actor: HVActor, message: string): Promise<void> {
    if (CONFIG.HV.itemClasses[this.data.type]) {
      CONFIG.HV.itemClasses[this.data.type].createChatMessage(actor, message, this.data);
    }
  }

  /** @override */
  async _onDropItem(event: DragEvent, data: ActorSheet.DropData.Item): Promise<unknown> {
    console.log('Item.onDropItem()', event, data);
    return null;
  }
}

declare global {
  interface DocumentClassConfig {
    Item: typeof HVItem;
  }

  interface DataConfig {
    Item: HVItemData;
  }
}
