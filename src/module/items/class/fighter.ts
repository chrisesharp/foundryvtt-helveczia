import { HVItem } from '../item';
import { Logger } from '../../logger';
import { HVActor } from '../../actor/actor';
import { ClassItemData } from '../item-types';

const log = new Logger();

export class Fighter {
  static specialisms(): string[] {
    return ['Soldier', 'Weapon Master', 'Champion', 'Duellist', 'Hussar', 'Sharpshooter'];
  }

  static async onCreate(item: HVItem): Promise<void> {
    const itemData = item.data as ClassItemData;
    console.log('itemData.data:', itemData.data);
    if (itemData.data.specialism) {
      console.log(`${item.name} is a specialism class of ${itemData.data.parent}`);
    }
    log.debug('Fighter.onCreate() | fighter-class flag set to true');
    await item.actor?.setFlag('helveczia', 'fighter-class', true);
  }

  static getSkillsBonus(actor: HVActor): number {
    if (!actor.isFighter()) return 0;
    const gainedThirdLevelSkill = actor.data.data.level === 3 || actor.data.data.level === 4;
    const gainedFifthLevelSkill = actor.data.data.level >= 5;
    actor.setFlag('helveczia', 'fighter-third-skill', gainedThirdLevelSkill);
    actor.setFlag('helveczia', 'fighter-fifth-skill', gainedFifthLevelSkill);
    const gainedSkills = [gainedThirdLevelSkill, gainedFifthLevelSkill]
      .map((i) => (i ? 1 : 0))
      .reduce((acc: number, n) => acc + n, 0);
    log.debug(`Fighter.getSkillsBonus() |  fighter-third-skill flag set to ${gainedThirdLevelSkill}`);
    log.debug(`Fighter.getSkillsBonus() |  fighter-fifth-skill flag set to ${gainedFifthLevelSkill}`);
    log.debug(`Fighter.getSkillsBonus() |  returning skills bonus as ${gainedSkills}`);
    return gainedSkills;
  }

  static async cleanup(actor: HVActor): Promise<void> {
    actor.setFlag('helveczia', 'fighter-class', false);
    log.debug('Fighter.getSkillsBonus() |  fighter-class flag set to false');
    actor.setFlag('helveczia', 'fighter-specialism', false);
    log.debug('Fighter.getSkillsBonus() |  fighter-specialism flag set to false');
    actor.setFlag('helveczia', 'fighter-third-skill', false);
    log.debug('Fighter.getSkillsBonus() |  fighter-third-skill flag set to false');
    actor.setFlag('helveczia', 'fighter-fifth-skill', false);
    log.debug('Fighter.getSkillsBonus() |  fighter-fifth-skill flag set to false');
  }
}
