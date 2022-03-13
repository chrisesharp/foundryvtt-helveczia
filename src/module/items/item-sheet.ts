export class HVItemSheet extends ItemSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['helveczia', 'sheet', 'item'],
      width: 350,
      height: 375,
      resizable: false,
    });
  }

  getData() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any = super.getData();

    // enforce data to ensure compatability between 0.7 and 0.8
    data.data = this.object.data.data;

    // Set owner name if possible
    data.isOwnedBy = this.actor ? this.actor.name : false;

    // Let every item type manipulate its own sheet data
    data = CONFIG.HV.itemClasses[this.item.type]?.getSheetData(data, this) || data;

    // Let every component manipulate an items' sheet data
    for (const sheetComponent in CONFIG.HV.sheetComponents.item) {
      if (Object.prototype.hasOwnProperty.call(CONFIG.HV.sheetComponents.item, sheetComponent)) {
        data = CONFIG.HV.sheetComponents.item[sheetComponent].getSheetData(data, this);
      }
    }

    return data;
  }

  get template() {
    return `systems/helveczia/templates/item/${this.item.data.type}-sheet.hbs`;
  }

  activateListeners(html) {
    super.activateListeners(html);

    for (const sheetComponent in CONFIG.HV.sheetComponents.item) {
      if (Object.prototype.hasOwnProperty.call(CONFIG.HV.sheetComponents.item, sheetComponent)) {
        CONFIG.HV.sheetComponents.item[sheetComponent].activateListeners(html, this);
      }
    }

    // Let every item type add its own sheet listeners
    CONFIG.HV.itemClasses[this.item.type]?.activateListeners(html, this);
  }
}
