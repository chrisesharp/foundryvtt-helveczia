import { DocumentModificationOptions } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
import { ItemDataBaseProperties } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData';
import { PropertiesToSource } from '@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes';
import { BaseItem } from '../base-item';
import { HVItem } from '../item';
import { Logger } from '../../logger';
import { DeedItemData } from '../item-types';
import { HVActor } from '../../actor/actor';

const log = new Logger();

export class DeedItem extends BaseItem {
  static get documentName() {
    return 'deed';
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
    options: DocumentModificationOptions,
    userId: string,
  ) {
    if (!item.isEmbedded) {
      await DeedItem.addDeedEffects(item);
    }
    log.debug('DeedItem.onCreate()|', item, data, options, userId);
  }

  static onDelete(actor, itemData) {
    log.debug('DeedItem.onDelete()|', actor, itemData);
  }

  static async onUpdate(
    item: HVItem,
    changed: DeepPartial<PropertiesToSource<ItemDataBaseProperties>>,
    options: DocumentModificationOptions,
    userId: string,
  ): Promise<void> {
    log.debug('DeedItem.onUpdate()|', item, changed, options, userId);
    if (!item.isEmbedded) {
      await DeedItem.addDeedEffects(item);
    }
  }

  /** @override */
  static getSheetData(sheetData, _item) {
    sheetData.deedTypes = CONFIG.HV.deedTypes;
    sheetData.virtueMagnitudes = CONFIG.HV.virtueMagnitudes;
    sheetData.sinMagnitudes = CONFIG.HV.sinMagnitudes;
    sheetData.cardinalVirtues = CONFIG.HV.cardinalVirtues;
    sheetData.cardinalSins = CONFIG.HV.cardinalSins;
    return sheetData;
  }

  static async getTags(item: HVItem, _actor: HVActor): Promise<string> {
    return `
    <ol class="tag-list">
      <li class="tag">${game.i18n.localize(`HV.deeds.${(item.data as DeedItemData).data.subtype}`)}</li>
      <li class="tag">${(item.data as DeedItemData).data.magnitude}</li>
    </ol>`;
  }

  static async addDeedEffects(item: HVItem) {
    log.debug('DeedItem.addDeedEffect() | adding deed effects for ', item);
    await Promise.all(
      item.effects.map((p) => {
        if (p.id) return item.deleteEmbeddedDocuments('ActiveEffect', [p.id]);
        return Promise.resolve();
      }),
    );
    const itemData = item.data as DeedItemData;
    const magnitude = itemData.data.magnitude;
    const subtype = itemData.data.subtype;
    const value = subtype === 'virtue' ? `${magnitude}` : `-${magnitude}`;
    const deedEffect = { key: 'data.virtue', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: value };
    const effect = await ActiveEffect.create(
      {
        label: game.i18n.localize(`HV.deeds.${subtype}`),
        icon: 'icons/svg/aura.svg',
        origin: item.uuid,
        transfer: true,
        changes: [deedEffect],
      },
      { parent: item },
    );
    if (effect) {
      await item.updateEmbeddedDocuments('ActiveEffect', [{ _id: effect.id, effects: [effect] }]);
    }
    // return item.update();
  }
}
