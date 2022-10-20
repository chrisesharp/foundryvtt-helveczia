import { DocumentModificationOptions } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
// eslint-disable-next-line prettier/prettier
import { ItemDataBaseProperties, ItemDataConstructorData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData';
import { BaseUser } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/documents.mjs';
import { PropertiesToSource } from '@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes';
import { HVActor } from '../actor/actor';
import { HVItemData } from './item-types';

export class HVItem extends Item {
  protected async _preCreate(
    data: ItemDataConstructorData,
    options: DocumentModificationOptions,
    user: BaseUser,
  ): Promise<void> {
    await super._preCreate(data, options, user);
    if (CONFIG.HV.itemClasses[this.type]) {
      await CONFIG.HV.itemClasses[this.type].preCreate(data, options, user);
    }
    this.updateSource(data);
  }

  protected async _onCreate(
    data: PropertiesToSource<ItemDataBaseProperties>,
    options: DocumentModificationOptions,
    userId: string,
  ): Promise<void> {
    super._onCreate(data, options, userId);
    // Let every itemType augment itself on creation
    if (CONFIG.HV.itemClasses[this.type]) {
      await CONFIG.HV.itemClasses[this.type].onCreate(this, data, options, userId);
    }
  }

  prepareData() {
    super.prepareData();

    // Let every itemType prepare itself
    if (this.actor) {
      if (CONFIG.HV.itemClasses[this.type]) {
        CONFIG.HV.itemClasses[this.type].prepareItemData(this);
      }
    }
  }

  //** @override */
  protected _onDelete(_options: DocumentModificationOptions, _userId: string): void {
    if (this.isEmbedded) {
      CONFIG.HV.itemClasses[this.type]?.onDelete(this.actor, this);
    }
  }

  //** @override */
  protected _onUpdate(
    changed: DeepPartial<PropertiesToSource<ItemDataBaseProperties>>,
    options: DocumentModificationOptions,
    userId: string,
  ): void {
    if (CONFIG.HV.itemClasses[this.type]) {
      CONFIG.HV.itemClasses[this.type]?.onUpdate(this, changed, options, userId);
    }
    super._onUpdate(changed, options, userId);
  }

  /** Augment actor skills  */
  getSkillsBonus(actor) {
    return CONFIG.HV.itemClasses[this.type] ? CONFIG.HV.itemClasses[this.type].getSkillsBonus(actor, this) : 0;
  }

  getSaveBase(actor): { bravery: number; deftness: number; temptation: number } {
    return CONFIG.HV.itemClasses[this.type]
      ? CONFIG.HV.itemClasses[this.type].getSaveBase(actor, this)
      : { bravery: 0, deftness: 0, temptation: 0 };
  }

  async createChatMessage(actor: HVActor, message: string): Promise<void> {
    if (CONFIG.HV.itemClasses[this.type]) {
      CONFIG.HV.itemClasses[this.type].createChatMessage(actor, message, this);
    }
  }

  /** @override */
  async _onDropItem(_event: DragEvent, _data: ActorSheet.DropData.Item): Promise<unknown> {
    // console.log('Item.onDropItem()', event, data);
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
