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
        CONFIG.HV.itemClasses[this.data.type].prepareItemData(this.data, this);
      }
    }
  }

  cleanup(actor: HVActor) {
    // TODO finish cleanup
    CONFIG.HV.itemClasses[this.data.type]?.cleanup(actor, this.data);
  }

  /** Augment actor skills  */
  getSkillBonus(actor) {
    return CONFIG.HV.itemClasses[this.data.type]
      ? CONFIG.HV.itemClasses[this.data.type].getSkillBonus(actor, this.data)
      : 0;
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
