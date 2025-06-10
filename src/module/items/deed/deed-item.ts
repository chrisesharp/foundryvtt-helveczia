import { DocumentModificationOptions } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
import {
  ItemDataBaseProperties,
  ItemDataConstructorData,
} from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData';
import { PropertiesToSource } from '@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes';
import { BaseItem } from '../base-item';
import { HVItem } from '../item';
import { Logger } from '../../logger';
import { DeedItemData } from '../item-types';
import { HVActor } from '../../actor/actor';
import { Utils } from '../../utils/utils';
import { BaseUser } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/documents.mjs';

const log = new Logger();

export class DeedItem extends BaseItem {
  // static DEFAULT_TOKEN = 'systems/helveczia/assets/icons/angel_sm.png';
  static DEFAULT_TOKEN = 'icons/svg/aura.svg';
  static get documentName() {
    return 'deed';
  }

  static async preCreate(data: ItemDataConstructorData, _options: DocumentModificationOptions, _user: BaseUser) {
    foundry.utils.mergeObject(
      data,
      {
        img: DeedItem.DEFAULT_TOKEN,
      },
      { overwrite: true },
    );
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
    foundry.utils.mergeObject(
      data,
      {
        img: DeedItem.DEFAULT_TOKEN,
      },
      { overwrite: true },
    );
    item.updateSource(data);
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
    if (game.user?.isGM && !item.isEmbedded) {
      await DeedItem.updateDeedEffects(item);
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
    const isSin = (item.system as DeedItemData).subtype === 'sin';
    const mag = isSin
      ? 0 - Math.floor((item.system as DeedItemData).magnitude)
      : 0 + Math.floor((item.system as DeedItemData).magnitude);
    const value = mag > 0 ? `+${mag}` : mag;
    return `
    <ol class="tag-list">
      <li class="tag">${game.i18n.localize(`HV.deeds.${(item.system as DeedItemData).subtype}`)}</li>
      <li class="tag">${value}</li>
    </ol>`;
  }

  static calculateEffectChange(item: HVItem) {
    const itemData = item.system as DeedItemData;
    const magnitude = itemData.magnitude;
    const subtype = itemData.subtype;
    const value = subtype === 'virtue' ? magnitude : 0 - magnitude;
    return { key: 'system.virtue', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: value };
  }

  static async addDeedEffects(item: HVItem) {
    log.debug('DeedItem.addDeedEffect() | adding deed effects for ', item);
    await Utils.deleteEmbeddedArray(
      item.effects.filter((_e) => true),
      item,
    );
    const deedEffect = DeedItem.calculateEffectChange(item);

    await ActiveEffect.create(
      {
        name: game.i18n.localize(`HV.deeds.${item.system.subtype}`),
        img: 'icons/svg/aura.svg',
        origin: item.uuid,
        transfer: true,
        changes: [deedEffect],
      },
      { parent: item },
    );
  }

  static async updateDeedEffects(item: HVItem) {
    log.debug('DeedItem.updateDeedEffecst() | updating deed effects for ', item);
    const changes = DeedItem.calculateEffectChange(item);
    const updates = item.effects.map((i) => ({ _id: i.id, changes: [changes] }));
    await item.updateEmbeddedDocuments('ActiveEffect', updates);
  }
}
