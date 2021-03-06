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
    if (itemData.data.specialism) {
      if (!item.actor?.isFighter()) {
        ui.notifications.error(game.i18n.localize('You must be a fighter for this specialism'));
        return;
      }
      log.debug(`Fighter.onCreate() | fighter-specialism flag set to ${item.name}`);
      await item.actor?.setFlag('helveczia', 'fighter-specialism', item.name);
      switch (item.name) {
        case 'Soldier':
          break;
      }
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

  static getSaveBase(actor: HVActor): { bravery: number; deftness: number; temptation: number } {
    const base = Math.floor(actor.data.data.level / 2);
    return { bravery: base + 2, deftness: base, temptation: base };
  }

  static async cleanup(actor: HVActor, _item: any): Promise<void> {
    await actor.setFlag('helveczia', 'fighter-class', false);
    log.debug('Fighter.getSkillsBonus() |  fighter-class flag set to false');
    await actor.setFlag('helveczia', 'fighter-specialism', false);
    log.debug('Fighter.getSkillsBonus() |  fighter-specialism flag set to false');
    await actor.setFlag('helveczia', 'fighter-third-skill', false);
    log.debug('Fighter.getSkillsBonus() |  fighter-third-skill flag set to false');
    await actor.setFlag('helveczia', 'fighter-fifth-skill', false);
    log.debug('Fighter.getSkillsBonus() |  fighter-fifth-skill flag set to false');
  }
}
