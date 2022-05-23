import { HVItem } from '../item';
import { Logger } from '../../logger';
import { HVActor } from '../../actor/actor';

const log = new Logger();

export class Vagabond {
  static async onCreate(item: HVItem): Promise<void> {
    log.debug('Vagabond.onCreate() | student-skill flag set to true');
    item.actor?.setFlag('helveczia', 'student-skill', true);
  }

  static getSkillsBonus(actor: HVActor): number {
    const gainedSkills = actor.isVagabond();
    actor.setFlag('helveczia', 'vagabond-skill', gainedSkills);
    log.debug('Vagabond.getSkillsBonus() |  vagabond-skill flag set to ', gainedSkills);
    return gainedSkills ? 4 : 0;
  }

  static async cleanup(actor: HVActor): Promise<void> {
    actor.setFlag('helveczia', 'vagabond-skill', false);
    log.debug('Vagabond.getSkillsBonus() |  vagabond-skill flag set to false');
  }
}
