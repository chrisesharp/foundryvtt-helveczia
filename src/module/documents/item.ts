import { HVActor } from '../documents/actor';
import { HVItemData } from '../types/item-types';

export class HVItem extends Item {
  /**
   * In Foundry V14 the `img` field's initial value comes from getDefaultArtwork() when the
   * document is constructed, before _preCreate runs. Changing createData inside _preCreate
   * does not change what gets persisted, so per-type default images must be supplied here.
   * @override
   */
  static getDefaultArtwork(itemData: { type?: string }): { img: string } {
    const img = CONFIG.HV?.itemClasses?.[itemData?.type ?? '']?.DEFAULT_TOKEN;
    return img ? { img } : super.getDefaultArtwork(itemData);
  }

  protected async _preCreate(
    data: DeepPartial<Item['_source']>,
    options: DocumentModificationContext,
    user: any,
  ): Promise<void> {
    await super._preCreate(data, options, user);
    if (CONFIG.HV.itemClasses[this.type]) {
      await CONFIG.HV.itemClasses[this.type].preCreate(data, options, user);
    }
    // Note: in Foundry V14 the pending document instance (not createData) is sent to the server,
    // so changes to `data` here are not persisted. Default images are handled by getDefaultArtwork().
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
      void CONFIG.HV.itemClasses[this.type]?.onUpdate(this, changed, options, userId);
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
      await CONFIG.HV.itemClasses[this.type].createChatMessage(actor, message, this as any);
    }
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
