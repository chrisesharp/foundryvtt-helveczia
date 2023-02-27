import { HVItem } from '../item';
import { Logger } from '../../logger';
import { HVActor } from '../../actor/actor';
import { ClassItemData, SkillItemData } from '../item-types';
import { Utils } from '../../utils/utils';

const log = new Logger();

const clericSpecialisms = {
  Spells: {
    description: 'HV.cleric.spells',
    flag: 'cleric-spells',
  },
  Exorcism: {
    description: 'HV.cleric.exorcism',
    flag: 'cleric-exorcism',
  },
  Healing: {
    description: 'HV.cleric.healing',
    flag: 'cleric-healing',
  },
};

async function deleteSpecialistSkill(actor: HVActor, name: string): Promise<void> {
  log.debug(`Cleric.deleteSpecialistSkill() | deleting ${name}`);
  const skills = actor.items.filter(
    (i) =>
      i.type === 'skill' &&
      i.name === name &&
      (i.system as SkillItemData).subtype === 'magical' &&
      (i as HVItem).getFlag('helveczia', 'locked') === true,
  );
  log.debug(`Cleric.deleteSpecialistSkill() | matching skills:`, skills);
  await Utils.deleteEmbeddedArray(skills, actor);
}

async function createSpecialistSkill(item: HVItem, skillData: any): Promise<void> {
  const itemData = (await item.actor?.createEmbeddedDocuments('Item', [skillData])) ?? [];
  const id = (itemData[0] as Item).id;
  if (id) {
    const i = item.actor?.items.get(id);
    if (i) {
      await i.setFlag('helveczia', 'locked', true);
      await item.actor?.update();
    }
  }
}

export class Cleric {
  static specialisms(): string[] {
    return Object.keys(clericSpecialisms);
  }

  static async onCreate(item: HVItem): Promise<void> {
    const actor = item.actor;
    const sourceItemData = item.system as ClassItemData;
    if (sourceItemData.specialism) {
      if (!actor?.isCleric()) {
        ui.notifications.error(
          game.i18n.format('HV.errors.requiredProfession', {
            requiredProfession: game.i18n.localize('HV.class.cleric'),
          }),
        );
        return;
      }
    } else {
      log.debug('Cleric.onCreate() | cleric-class flag set to true');
      actor?.setFlag('helveczia', 'cleric-class', true);
      Promise.all(
        Object.keys(clericSpecialisms).map((s) => {
          const skill = {
            name: s,
            type: 'skill',
            img: 'icons/svg/mystery-man.svg',
            data: {
              description: game.i18n.localize(clericSpecialisms[s].description),
              ability: '',
              subtype: 'magical',
            },
          };
          actor?.setFlag('helveczia', clericSpecialisms[s].flag, true);
          return createSpecialistSkill(item, skill);
        }),
      );
    }
  }

  static getSkillsBonus(actor: HVActor): number {
    const gainedSixthLevelSkills = actor?.isCleric() && actor.system.level == 6;
    // base 3 extra to cover Cleric specialist skills. and 6 extra at 6th level
    return gainedSixthLevelSkills ? 9 : 3;
  }

  static getSaveBase(actor: HVActor): { bravery: number; deftness: number; temptation: number } {
    const base = Math.floor(actor.system.level / 2);
    return { bravery: base + 2, deftness: base, temptation: base + 2 };
  }

  static getSpellSlots(actor: HVActor): number[] {
    const level = actor.system.level;
    const bonus = actor.getSpellBonus();
    const spells = duplicate(CONFIG.HV.spellSlots[level]);
    for (const i in spells) {
      spells[i] += bonus[i];
    }
    log.debug(`Cleric.getSpellSlots() | WIS of ${bonus} results in `, spells);
    return spells;
  }

  static async cleanup(actor: HVActor, _item: any): Promise<void> {
    Promise.all(
      Object.keys(clericSpecialisms).map((s) => {
        actor?.setFlag('helveczia', clericSpecialisms[s].flag, false);
        return deleteSpecialistSkill(actor, s);
      }),
    );
    log.debug('Cleric.cleanup() |  cleric-class flag set to false');
    actor.setFlag('helveczia', 'cleric-class', false);
  }
}
