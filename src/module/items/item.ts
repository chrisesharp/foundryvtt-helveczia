import { HVItemData } from './item-types';

export type SaveModifier = {
  type: string;
  val: number;
};

export class HVItem extends Item {
  prepareData() {
    super.prepareData();

    // Let every itemType prepare itself
    if (this.actor?.data) {
      if (CONFIG.HV.itemClasses[this.data.type]) {
        CONFIG.HV.itemClasses[this.data.type].prepareItemData(this.data, this);
      }
    }
  }

  /**
   * get saving throw modifiers for this item
   */
  getSaves(): SaveModifier[] {
    if (CONFIG.HV.itemClasses[this.data.type]) {
      return CONFIG.HV.itemClasses[this.data.type].getSaves(this);
    }
    return [];
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
