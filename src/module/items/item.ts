import { HVItemData } from './item-types';

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
}

declare global {
  interface DocumentClassConfig {
    Item: typeof HVItem;
  }

  interface DataConfig {
    Item: HVItemData;
  }
}
