import { DocumentModificationOptions } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
import { ItemDataBaseProperties } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData';
import { PropertiesToSource } from '@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes';
import { HVActor } from '../../actor/actor';
import { BaseItem } from '../base-item';
import { HVItem } from '../item';
import { SpellItemData } from '../item-types';

const DEFAULT_TOKEN = 'icons/svg/daze.svg';

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
    item: HVItem,
    data: PropertiesToSource<ItemDataBaseProperties>,
    _options: DocumentModificationOptions,
    _userId: string,
  ) {
    mergeObject(
      data,
      {
        img: DEFAULT_TOKEN,
      },
      { overwrite: true },
    );
    item.data.update(data);
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
    saves['-'] = '-';
    sheetData.saves = saves;
    return sheetData;
  }

  /** @override */
  static async getTags(item: HVItem, _actor: HVActor): Promise<string> {
    const itemData = item.data as SpellItemData;
    return `
    <ol class="tag-list">
      <li class="tag" title="${game.i18n.localize('HV.Save')}">${game.i18n.localize(
      `HV.saves.${itemData.data.save}.long`,
    )}</li>
    </ol>`;
  }
}
