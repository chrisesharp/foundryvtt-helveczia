import { HVItem } from '../item';
import { Logger } from '../../logger';
import { HVActor } from '../../actor/actor';
// import { SkillItemData } from '../item-types';

const log = new Logger();

export class Cleric {
  static async onCreate(_item: HVItem): Promise<void> {
    // NOOP
  }

  static getSkillsBonus(actor: HVActor): number {
    const gainedSixthLevelSkills = actor.isCleric() && actor.data.data.level == 6;
    actor.setFlag('helveczia', 'cleric-skill', gainedSixthLevelSkills);
    log.debug('Cleric.getSkillsBonus() |  cleric-skill flag set to ', gainedSixthLevelSkills);
    return gainedSixthLevelSkills ? 6 : 0;
  }

  static async cleanup(actor: HVActor): Promise<void> {
    actor.setFlag('helveczia', 'cleric-skill', false);
  }
}
