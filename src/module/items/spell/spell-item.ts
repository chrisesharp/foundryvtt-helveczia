import { DocumentModificationOptions } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
import {
  ItemData,
  ItemDataConstructorData,
} from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData';
import { BaseUser } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/documents.mjs';
import { HVActor } from '../../actor/actor';
import { BaseItem } from '../base-item';
import { HVItem } from '../item';
import { SpellItemData } from '../item-types';
const { renderTemplate } = foundry.applications.handlebars;

export class SpellItem extends BaseItem {
  static DEFAULT_TOKEN = 'icons/svg/daze.svg';
  static get documentName() {
    return 'possession';
  }

  static async createChatMessage(actor: HVActor, message: string, data: ItemData): Promise<void> {
    const speaker = ChatMessage.getSpeaker({ actor: actor });
    const title = game.i18n.localize(message);
    let summary: string;

    switch (message) {
      case 'HV.SpellCast':
        summary = game.i18n.format('HV.CastsSpell', { spell: data.name, caster: speaker.alias });
        break;
      case 'HV.SpellLost.abbr':
        summary = game.i18n.localize('HV.SpellLost.long');
        break;
      default:
        summary = game.i18n.format('HV.MemorizeSpell', { spell: data.name, caster: speaker.alias });
    }

    const templateData = {
      config: CONFIG.HV,
      summary: summary,
      actor: actor,
      title: title,
    };
    const content = await renderTemplate('systems/helveczia/templates/chat/cast-spell.hbs', templateData);
    ChatMessage.create({
      content: content,
      speaker,
      blind: false,
    });
  }

  static async preCreate(data: ItemDataConstructorData, _options: DocumentModificationOptions, _user: BaseUser) {
    foundry.utils.mergeObject(
      data,
      {
        img: SpellItem.DEFAULT_TOKEN,
      },
      { overwrite: true },
    );
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
    const itemData = item.system as SpellItemData;
    const tag = itemData.save !== '-' ? game.i18n.localize(`HV.saves.${itemData.save}.long`) : undefined;
    const line = tag ? `<li class="tag" title="${game.i18n.localize('HV.Save')}">${tag}</li>` : '';
    return `
    <ol class="tag-list">
      ${line}
    </ol>`;
  }
}
