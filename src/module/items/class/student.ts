import { HVItem } from '../item';
import { Logger } from '../../logger';
import { HVActor } from '../../actor/actor';
import { ClassItemData, SkillItemData } from '../item-types';
import { Utils } from '../../utils/utils';

const log = new Logger();

const studentSpecialisms = {
  Spells: {
    description: 'HV.student.spells',
    flag: 'student-spells',
  },
  Doctorate: {
    description: 'HV.student.doctorate',
    flag: 'student-doctorate',
  },
};

const specialistSkills = ['Spells'];

async function deleteSpecialistSkill(actor: HVActor, name: string): Promise<void> {
  log.debug(`Student.deleteSpecialistSkill() | deleting ${name}`);
  const skills = actor.items.filter(
    (i) =>
      i.type === 'skill' &&
      i.name === name &&
      (i.system as SkillItemData).subtype === 'magical' &&
      i.getFlag('helveczia', 'locked') === true,
  );
  log.debug(`Student.deleteSpecialistSkill() | matching skills:`, skills);
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

export class Student {
  static specialisms(): string[] {
    return Object.keys(studentSpecialisms);
  }

  static async onCreate(item: HVItem): Promise<void> {
    const sourceItemData = item.system as ClassItemData;
    if (sourceItemData.specialism) {
      if (!item.actor?.isStudent()) {
        ui.notifications.error(
          game.i18n.format('HV.errors.requiredProfession', {
            requiredProfession: game.i18n.localize('HV.class.student'),
          }),
        );
        return;
      }

      if (item.name === 'Doctorate') {
        const reqLevel = item.actor.isCzech() ? 4 : 6;
        if (item.actor.system.level >= reqLevel) {
          log.debug('Student.onCreate() | student-doctorate flag set to true');
          await item.actor?.setFlag('helveczia', 'student-doctorate', true);
          Math.floor(Math.random());
          const extra_spells = [
            1 + Math.round(Math.random()),
            1 + Math.round(Math.random()),
            1 + Math.round(Math.random()),
          ]
            .sort()
            .reverse();
          await item.actor?.setFlag('helveczia', 'student-dr-spells', extra_spells);
          const totalExtra = extra_spells.reduce((acc, val) => acc + val, 0);
          ui.notifications.info(game.i18n.localize('HV.student.docBonus') + `: ${totalExtra}`);
        } else {
          ui.notifications.error(game.i18n.localize('HV.errors.requiredLevel'));
        }
      }
    } else {
      log.debug('Student.onCreate() | student-class flag set to true');
      item.actor?.setFlag('helveczia', 'student-class', true);
      Promise.all(
        specialistSkills.map((s) => {
          const skill = {
            name: s,
            type: 'skill',
            img: 'icons/svg/book.svg',
            system: {
              description: game.i18n.localize(studentSpecialisms[s].description),
              ability: '',
              subtype: 'magical',
            },
          };
          item.actor?.setFlag('helveczia', studentSpecialisms[s].flag, true);
          return createSpecialistSkill(item, skill);
        }),
      );
    }
  }

  static getSkillsBonus(actor: HVActor): number {
    const doctorateSkill = actor.getFlag('helveczia', 'student-doctorate');
    // base 2 extra to cover Student specialist skills. and 2 extra science as a student
    const bonusSkills = specialistSkills.length + 2;
    return doctorateSkill ? bonusSkills + 1 : bonusSkills;
  }

  static getSaveBase(actor: HVActor): { bravery: number; deftness: number; temptation: number } {
    const base = Math.floor(actor.system.level / 2);
    return { bravery: base, deftness: base, temptation: base + 2 };
  }

  static getSpellSlots(actor: HVActor): number[] {
    const level = actor.system.level;
    const bonus = actor.getSpellBonus();
    const spells = foundry.utils.duplicate(CONFIG.HV.spellSlots[level]);
    const extra_spells = actor.getFlag('helveczia', 'student-doctorate')
      ? actor.getFlag('helveczia', 'student-dr-spells')
      : [0, 0, 0];
    for (const i in spells) {
      spells[i] += bonus[i] + extra_spells[i];
    }
    log.debug(`Student.getSpellSlots() | INT of ${bonus} results in `, spells);
    return spells;
  }

  static async cleanup(actor: HVActor, item: any): Promise<void> {
    const sourceItemData = item.system as ClassItemData;
    if (sourceItemData.specialism) {
      return;
    }
    Promise.all(
      Object.keys(studentSpecialisms).map((s) => {
        actor?.setFlag('helveczia', studentSpecialisms[s].flag, false);
        return deleteSpecialistSkill(actor, s);
      }),
    );
    await actor.setFlag('helveczia', 'student-class', false);
    const sciences = actor.items.filter(
      (i) => (i.system as SkillItemData).subtype === 'science' && i.getFlag('helveczia', 'locked') === true,
    );
    if (sciences.length > 0) {
      for (const science of sciences) {
        if (science.id) {
          const flag =
            actor.getFlag('helveczia', 'student-skill-generated-1') === science.name
              ? 'student-skill-generated-1'
              : 'student-skill-generated-2';
          await actor.setFlag('helveczia', flag, false);
          log.debug(`Student.cleanup() |  ${flag} flag set to false`);
          await actor.deleteEmbeddedDocuments('Item', [science.id]);
          await actor.sheet?.render(true);
        }
      }
    }
  }
}
