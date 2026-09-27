import type { DocumentModificationContext } from '../types/foundry-types';
import { HVActor } from '../documents/actor';
import { HVItemData } from '../../types/item-types';

export class HVItem extends Item {
  protected async _preCreate(
    data: DeepPartial<Item['_source']>,
    options: DocumentModificationContext,
    user: foundry.documents.BaseUser,
  ): Promise<void> {
    await super._preCreate(data, options, user);
    if (CONFIG.HV.itemClasses[this.type]) {
      await CONFIG.HV.itemClasses[this.type].preCreate(data, options, user);
    }
    // Note: do NOT call this.updateSource(data) here. In Foundry V14, _preCreate operates on
    // createData which is sent to the server as-is; updateSource only modifies the ephemeral
    // temp document and has no effect on what gets persisted.
  }

  protected async _onCreate(
    data: Item['_source'],
    options: DocumentModificationContext,
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
  protected _onDelete(_options: DocumentModificationContext, _userId: string): void {
    if (this.isEmbedded) {
      CONFIG.HV.itemClasses[this.type]?.onDelete(this.actor, this);
    }
  }

  //** @override */
  protected _onUpdate(
    changed: DeepPartial<Item['_source']>,
    options: DocumentModificationContext,
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
