import { HVItem } from './item';
import { Logger } from '../logger';
import { HVActor } from './actor';
import { ClassData } from '../types/item-types';
import { createLockedSkill, deleteLockedSkill } from './class-utils';

const log = new Logger();

const clericSpecialisms = {
  spells: {
    description: 'HV.cleric.spells',
    flag: 'cleric-spells',
  },
  exorcism: {
    description: 'HV.cleric.exorcism',
    flag: 'cleric-exorcism',
  },
  healing: {
    description: 'HV.cleric.healing',
    flag: 'cleric-healing',
  },
  doctorate: {
    description: 'HV.cleric.doctorate',
    flag: 'cleric-doctorate',
  },
};

const specialistSkills = ['spells', 'exorcism', 'healing'];

export class Cleric {
  // eslint-disable-next-line @typescript-eslint/ban-types
  static specialisms(): {} {
    const keys = ['spells', 'healing', 'exorcism', 'doctorate'];
    return keys.reduce((dict, p) => {
      dict[p] = game.i18n.localize(`HV.specialisms.cleric.${p}`);
      return dict;
    }, {});
  }

  static async onCreate(item: HVItem): Promise<void> {
    const actor = item.actor;
    const sourceItemData = item.system as ClassData;
    if (sourceItemData.specialism) {
      if (!actor?.isCleric()) {
        ui.notifications.error(
          game.i18n.format('HV.errors.requiredProfession', {
            requiredProfession: game.i18n.localize('HV.class.cleric'),
          }),
        );
        return;
      }

      const specialisms = Cleric.specialisms();
      let isDoctorate = false;
      for (const s in specialisms) {
        if (specialisms[s] === 'doctorate') isDoctorate = true;
      }
      if (isDoctorate) {
        if (item.actor?.system.level == 6) {
          log.debug('Cleric.onCreate() | cleric-doctorate flag set to true');
          await item.actor?.setFlag('helveczia', 'cleric-doctorate', true);
        } else {
          ui.notifications.error(game.i18n.localize('HV.errors.requiredLevel'));
        }
      }
    } else {
      log.debug('Cleric.onCreate() | cleric-class flag set to true');
      await actor?.setFlag('helveczia', 'cleric-class', true);
      await Promise.all(
        specialistSkills.map(async (s) => {
          const skill = {
            name: game.i18n.localize(`HV.specialisms.cleric.${s}`),
            type: 'skill',
            img: 'icons/svg/mystery-man.svg',
            system: {
              description: game.i18n.localize(clericSpecialisms[s].description),
              ability: '',
              subtype: 'magical',
            },
          };
          await actor?.setFlag('helveczia', clericSpecialisms[s].flag, true);
          return createLockedSkill(item, skill);
        }),
      );
    }
  }

  static getSkillsBonus(actor: HVActor): number {
    const doctorateSkill = actor.getFlag('helveczia', 'cleric-doctorate');
    // base 3 extra to cover Cleric specialist skills. and 1 extra at 6th level
    const bonusSkills = specialistSkills.length;
    return doctorateSkill ? bonusSkills + 1 : bonusSkills;
  }

  static getSaveBase(actor: HVActor): { bravery: number; deftness: number; temptation: number } {
    const base = Math.floor(actor.system.level / 2);
    return { bravery: base + 2, deftness: base, temptation: base + 2 };
  }

  static getSpellSlots(actor: HVActor): number[] {
    const level = actor.system.level;
    const bonus = actor.getSpellBonus();
    const spells = foundry.utils.duplicate(CONFIG.HV.spellSlots[level]);
    for (const i in spells) {
      spells[i] += bonus[i];
    }
    log.debug(`Cleric.getSpellSlots() | WIS of ${bonus} results in `, spells);
    return spells;
  }

  static async cleanup(actor: HVActor, item: any): Promise<void> {
    const sourceItemData = item.system as ClassData;
    if (sourceItemData.specialism) {
      return;
    }
    await Promise.all(
      Object.keys(clericSpecialisms).map((s) => {
        actor?.setFlag('helveczia', clericSpecialisms[s].flag, false);
        return deleteLockedSkill(actor, game.i18n.localize(`HV.specialisms.cleric.${s}`), 'magical');
      }),
    );
    log.debug('Cleric.cleanup() |  cleric-class flag set to false');
    await actor.setFlag('helveczia', 'cleric-class', false);
  }
}
