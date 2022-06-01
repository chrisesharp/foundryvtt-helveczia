import { HVItem } from '../item';
import { Logger } from '../../logger';
import { HVActor } from '../../actor/actor';
import { ClassItemData, SkillItemData } from '../item-types';

const log = new Logger();

const studentSpecialisms = {
  Spells: {
    description: `Secreted away in dark folios and
    manuscripts, Student spells must be committed
    to the mind with difficult methods,
    Latin formulae, and the study of goetic
    principles. Furthermore, spells require
    special material components, which need
    to be acquired and prepared with no small
    effort. Once used, spells are gone, and
    must be relearned; similarly, components
    are of finite use.`,
    flag: 'student-spells',
  },
  Doctorate: {
    description: `Students who reach sixth level
    may obtain a university doctorate by presenting
    and defending their scientific findings,
    at no small cost and effort. This is the
    source of significant prestige, but also has
    more tangible benefits. The character can
    distribute 6 extra points among Science skills
    (although a single skill can only be increased
    by 3), or learn a completely new Science.
    Furthermore, not only do they obtain 1d3+3
    levels’ worth of new spells in the process, but
    from now on, they can also devise spells of
    their own, which will bear their name till the
    end of the world.`,
    flag: 'student-doctorate',
  },
};

async function deleteSpecialistSkill(actor: HVActor, name: string): Promise<void> {
  log.debug(`Student.deleteSpecialistSkill() | deleting ${name}`);
  const skills = actor.items.filter(
    (i) => i.type === 'skill' && i.name === name && (i.data as SkillItemData).data.subtype === 'magical',
  );
  log.debug(`Student.deleteSpecialistSkill() | matching skills:`, skills);
  if (skills.length > 0) {
    for (const skill of skills) {
      if (skill.getFlag('helveczia', 'locked') && skill.id) {
        log.debug(`Student.deleteSpecialistSkill() | deleteing :`, skill);
        await actor.deleteEmbeddedDocuments('Item', [skill.id]);
      }
    }
  }
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
    const sourceItemData = item.data as ClassItemData;
    if (sourceItemData.data.specialism) {
      if (!item.actor?.isStudent()) {
        ui.notifications.error(game.i18n.localize('You must be a student for this specialism'));
        return;
      }
    } else {
      log.debug('Student.onCreate() | student-class flag set to true');
      item.actor?.setFlag('helveczia', 'student-class', true);
      Promise.all(
        Object.keys(studentSpecialisms).map((s) => {
          const skill = {
            name: s,
            type: 'skill',
            data: {
              description: studentSpecialisms[s].description,
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
    const gainedSkills = actor.isStudent();
    actor.setFlag('helveczia', 'student-skill', gainedSkills);
    log.debug('Student.getSkillsBonus() |  student-skill flag set to ', gainedSkills);
    return gainedSkills ? 2 : 0;
  }

  static getSpellSlots(actor: HVActor): number[] {
    const level = actor.data.data.level;
    const bonus = actor.data.data.scores.int.value;
    const spells = duplicate(CONFIG.HV.spellSlots[level]);
    if (bonus >= 12) spells[0] += 1;
    if (bonus >= 15) spells[1] += 1;
    if (bonus >= 18) spells[2] += 1;
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
      (i) => i.type === 'skill' && (i.data as SkillItemData).data.subtype === 'science',
    );
    if (sciences.length > 0) {
      for (const science of sciences) {
        if (science.getFlag('helveczia', 'locked') && science.id) {
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
