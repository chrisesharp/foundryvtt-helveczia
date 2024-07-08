import { DocumentModificationOptions } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/document.mjs';
import { ItemDataBaseProperties } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/itemData';
import { PropertiesToSource } from '@league-of-foundry-developers/foundry-vtt-types/src/types/helperTypes';
import { HVActor } from '../../actor/actor';
import { BaseItem } from '../base-item';
import { HVItem } from '../item';
import { SkillItemData } from '../item-types';
import { Logger } from '../../logger';
import { HVActorData } from '../../actor/actor-types';
import { Utils } from '../../utils/utils';

const log = new Logger();
const DEFAULT_TOKEN = 'icons/svg/village.svg';

type PeoplesEntry = {
  onCreate?: (item: HVItem) => void;
  skillBonus?: (actor: HVActor) => number;
  onDelete?: (actor: HVActor) => void;
};

export class PeopleItem extends BaseItem {
  static races: {
    [key: string]: PeoplesEntry;
  } = {
    German: {
      onCreate: PeopleItem.onCreateGerman,
      skillBonus: PeopleItem.getGermanSkill,
      onDelete: PeopleItem.cleanupGermanSkill,
    },
    French: {},
    Italian: { onCreate: PeopleItem.onCreateItalian, onDelete: PeopleItem.cleanupItalian },
    Dutch: { onCreate: PeopleItem.onCreateDutch, onDelete: PeopleItem.cleanupDutch },
    Czech: {
      onCreate: PeopleItem.onCreateCzech,
      skillBonus: PeopleItem.getCzechSkill,
      onDelete: PeopleItem.cleanupCzechSkill,
    },
    English: {},
    Gypsy: {},
    Hungarian: {},
    Jewish: {},
    Cossack: {},
    Polish: {},
    Spanish: {},
    Swedish: {},
  };

  static async onCreateGerman(item: HVItem): Promise<void> {
    item.actor?.setFlag('helveczia', 'german-skill', true);
  }

  static getGermanSkill(_actor: HVActor): number {
    return 1;
  }

  static async onCreateItalian(item: HVItem): Promise<void> {
    const currenWealth = foundry.utils.duplicate((item.actor?.system as HVActorData).wealth);
    const fortune = Math.round(Math.random() * 5) + 1;
    currenWealth.th += fortune;
    await item.actor?.update({ system: { wealth: currenWealth } });
    await item.actor?.setFlag('helveczia', 'italian-fortune', fortune);
  }

  static getItalianSkill(_actor: HVActor): number {
    return 0;
  }

  static async cleanupItalian(actor: HVActor): Promise<void> {
    const fortune = actor.getFlag('helveczia', 'italian-fortune') as number;
    if (fortune) {
      const currenWealth = foundry.utils.duplicate((actor?.system as HVActorData).wealth);
      currenWealth.th -= fortune;
      await actor?.update({ system: { wealth: currenWealth } });
    }
    await actor?.setFlag('helveczia', 'italian-fortune', false);
  }

  static async cleanupGermanSkill(actor: HVActor): Promise<void> {
    actor.setFlag('helveczia', 'german-skill', false);
    const crafts = actor.items.filter(
      (i) =>
        i.type === 'skill' &&
        (i.system as SkillItemData).subtype === 'craft' &&
        i.getFlag('helveczia', 'locked') === true,
    );
    await Utils.deleteEmbeddedArray(crafts, actor);
  }

  static async onCreateDutch(item: HVItem): Promise<void> {
    item.actor?.setFlag('helveczia', 'dutch-skill', true);
    if (!item.actor?.getFlag('helveczia', 'dutch-onions')) {
      const onions = {
        name: 'Onions',
        type: 'possession',
        system: {
          description:
            'The Dutch begin their career with 1d3+1 onions. <p> Why this strange junk is so important to the Dutch, only the Lord knows.',
        },
      };
      await item.actor?.createEmbeddedDocuments('Item', [onions]);
      await item.actor?.setFlag('helveczia', 'dutch-onions', true);
    }
  }

  static async cleanupDutch(actor: HVActor): Promise<void> {
    actor?.setFlag('helveczia', 'dutch-skill', false);
  }

  static async onCreateCzech(item: HVItem): Promise<void> {
    const gainedSkill = item.actor?.isCleric() || item.actor?.isStudent();
    item.actor?.setFlag('helveczia', 'czech-skill', gainedSkill);
  }

  static getCzechSkill(actor: HVActor): number {
    const isStudentOrCleric = actor?.isCleric() || actor?.isStudent();
    const scienceSkill = isStudentOrCleric ? 1 : 0;
    return scienceSkill;
  }

  static async cleanupCzechSkill(actor: HVActor): Promise<void> {
    actor.setFlag('helveczia', 'czech-skill', false);
  }

  static get documentName() {
    return 'people';
  }

  static augmentOwnedItem(actor, data) {
    if (data.type === 'skill') {
      if (actor.isDutch()) {
        if (data.name === game.i18n.localize('Sail') || data.name === game.i18n.localize('Appraise')) {
          data.system.bonus = 2;
        }
      } else if (actor.isItalian()) {
        if (data.name === game.i18n.localize('Gambling')) {
          data.system.bonus = 2;
        }
      }
    }
    return data;
  }

  /**
   * Adds skill specifig actorsheet listeners.
   */
  static activateActorSheetListeners(html, sheet) {
    super.activateActorSheetListeners(html, sheet);

    // Check or uncheck a single box
    // html.find(".helveczia-possession").click((e) => this._onRollSkill.call(this, e, sheet));
  }

  static findPeoples(itemData: ItemData): PeoplesEntry | undefined {
    let peoplesName = itemData.name;
    for (const r in PeopleItem.races) {
      const name = game.i18n.localize(`HV.peoples.${r}`);
      if (name == peoplesName) {
        peoplesName = r;
        break;
      }
    }
    return PeopleItem.races[peoplesName];
  }

  static async onCreate(
    item: HVItem,
    itemData: PropertiesToSource<ItemDataBaseProperties>,
    _options: DocumentModificationOptions,
    _userId: string,
  ) {
    if (!Utils.canModifyActor(game.user, item.actor)) {
      return;
    }

    foundry.utils.mergeObject(
      itemData,
      {
        img: DEFAULT_TOKEN,
      },
      { overwrite: true },
    );
    item.updateSource(itemData);

    if (item.parent) {
      const peoples = PeopleItem.findPeoples(itemData);
      const func = peoples?.onCreate;
      if (func) func(item);
    }
  }

  static peoples() {
    return Object.keys(PeopleItem.races).reduce((dict, p) => {
      dict[p] = game.i18n.localize(`HV.peoples.${p}`);
      return dict;
    }, {});
  }

  static getSkillsBonus(actor, itemData) {
    let bonus = 0;
    const peoples = PeopleItem.findPeoples(itemData);
    const func = peoples?.skillBonus;
    if (func) {
      bonus += func(actor);
    }
    log.debug(`PeopleItem.getSkillsBonus() | skill bonus for ${itemData.name} is ${bonus}`);
    return bonus;
  }

  static onDelete(actor, itemData) {
    const peoples = PeopleItem.findPeoples(itemData);
    const func = peoples?.onDelete;
    if (func) {
      func(actor);
    }
  }

  static async enableHungarianFate(actor: HVActor): Promise<{ mod: number; attr: string }> {
    if (!actor.getFlag('helveczia', 'fate-invoked')) {
      actor.setFlag('helveczia', 'fate-invoked', true);
      const randomSave = ['bravery', 'deftness', 'temptation'][Math.floor(Math.random() * 3)];
      await actor.setFlag('helveczia', 'fate-save', randomSave);
      ChatMessage.create({
        user: game.user?.id,
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        content: await renderTemplate('systems/helveczia/templates/chat/hungarian-fate.hbs', {
          randomSave: randomSave,
          actor: actor,
        }),
      });
    }
    const attr = (await actor.getFlag('helveczia', 'fate-save')) as string;
    return { mod: -2, attr: attr };
  }
}
