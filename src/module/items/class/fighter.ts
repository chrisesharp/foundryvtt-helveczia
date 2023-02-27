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
    const itemData = item.system as ClassItemData;
    if (itemData.specialism) {
      if (!item.actor?.isFighter()) {
        ui.notifications.error(
          game.i18n.format('HV.errors.requiredProfession', {
            requiredProfession: game.i18n.localize('HV.class.fighter'),
          }),
        );
        return;
      }
      log.debug(`Fighter.onCreate() | fighter-specialism flag set to ${item.name}`);
      const actor = item.actor;
      await actor?.setFlag('helveczia', 'fighter-specialism', item.name);
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
    const gainedThirdLevelSkill = actor?.system.level >= 3;
    const gainedFifthLevelSkill = actor?.system.level >= 5;
    const gainedSkills = [gainedThirdLevelSkill, gainedFifthLevelSkill]
      .map((i) => (i ? 1 : 0))
      .reduce((acc: number, n) => acc + n, 0);
    log.debug(`Fighter.getSkillsBonus() |  returning skills bonus as ${gainedSkills}`);
    return gainedSkills;
  }

  static getSaveBase(actor: HVActor): { bravery: number; deftness: number; temptation: number } {
    const base = Math.floor(actor.system.level / 2);
    return { bravery: base + 2, deftness: base, temptation: base };
  }

  static async cleanup(actor: HVActor, _item: any): Promise<void> {
    await actor.setFlag('helveczia', 'fighter-class', false);
    log.debug('Fighter.getSkillsBonus() |  fighter-class flag set to false');
    await actor.setFlag('helveczia', 'fighter-specialism', false);
    log.debug('Fighter.getSkillsBonus() |  fighter-specialism flag set to false');
  }
}
