import { DocumentModificationOptions } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
import { ItemDataBaseProperties } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData';
import { PropertiesToSource } from '@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes';
import { BaseItem } from '../base-item';
import { HVItem } from '../item';

export class SpellItem extends BaseItem {
  static get documentName() {
    return 'possession';
  }

  /**
   * Adds skill specifig actorsheet listeners.
   */
  static activateActorSheetListeners(html, sheet) {
    super.activateActorSheetListeners(html, sheet);

    // Check or uncheck a single box
    // html.find(".helveczia-possession").click((e) => this._onRollSkill.call(this, e, sheet));
  }

  static async onCreate(
    _item: HVItem,
    _data: PropertiesToSource<ItemDataBaseProperties>,
    _options: DocumentModificationOptions,
    _userId: string,
  ) {
    // console.log('in PossessionItem.onCreate():', item, data, options, userId);
  }

  /** @override */
  static getSheetData(sheetData, _item) {
    const classes = {};
    CONFIG.HV.magicalClasses.forEach((a) => {
      classes[a] = game.i18n.localize(`HV.class.${a}`);
    });
    sheetData.classes = classes;
    const saves = {};
    CONFIG.HV.saves.forEach((a) => {
      saves[a] = game.i18n.localize(`HV.saves.${a}.long`);
    });
    sheetData.saves = saves;
    return sheetData;
  }
}
