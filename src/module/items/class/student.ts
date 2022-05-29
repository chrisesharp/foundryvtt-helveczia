import { HVItem } from '../item';
import { Logger } from '../../logger';
import { HVActor } from '../../actor/actor';
import { SkillItemData } from '../item-types';

const log = new Logger();

export class Student {
  static async onCreate(item: HVItem): Promise<void> {
    log.debug('Student.onCreate() | student-skill flag set to true');
    item.actor?.setFlag('helveczia', 'student-skill', true);
  }

  static getSkillsBonus(actor: HVActor): number {
    const gainedSkills = actor.isStudent();
    actor.setFlag('helveczia', 'student-skill', gainedSkills);
    log.debug('Student.getSkillsBonus() |  student-skill flag set to ', gainedSkills);
    return gainedSkills ? 2 : 0;
  }

  static async cleanup(actor: HVActor, _item: any): Promise<void> {
    actor.setFlag('helveczia', 'student-skill', false);
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
