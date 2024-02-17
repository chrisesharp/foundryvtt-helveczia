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
    } else {
      log.debug('Student.onCreate() | student-class flag set to true');
      item.actor?.setFlag('helveczia', 'student-class', true);
      Promise.all(
        specialistSkills.map((s) => {
          const skill = {
            name: s,
            type: 'skill',
            img: 'icons/svg/book.svg',
            data: {
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
    const gainedSkills = actor.isStudent() && actor.system.level == 6;
    // base 2 extra to cover Student specialist skills. and 2 extra science as a student
    const bonusSkills = specialistSkills.length + 2;
    return gainedSkills ? bonusSkills + 1 : bonusSkills;
  }

  static getSaveBase(actor: HVActor): { bravery: number; deftness: number; temptation: number } {
    const base = Math.floor(actor.system.level / 2);
    return { bravery: base, deftness: base, temptation: base + 2 };
  }

  static getSpellSlots(actor: HVActor): number[] {
    const level = actor.system.level;
    const bonus = actor.getSpellBonus();
    const spells = duplicate(CONFIG.HV.spellSlots[level]);
    for (const i in spells) {
      spells[i] += bonus[i];
    }
    log.debug(`Student.getSpellSlots() | INT of ${bonus} results in `, spells);
    return spells;
  }

  static async cleanup(actor: HVActor, _item: any): Promise<void> {
    Promise.all(
      Object.keys(studentSpecialisms).map((s) => {
        actor?.setFlag('helveczia', studentSpecialisms[s].flag, false);
        return deleteSpecialistSkill(actor, s);
      }),
    );
    actor.setFlag('helveczia', 'student-class', false);
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
