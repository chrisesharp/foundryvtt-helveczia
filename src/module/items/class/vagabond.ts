import { HVItem } from '../item';
import { Logger } from '../../logger';
import { HVActor } from '../../actor/actor';
import { ClassItemData } from '../item-types';

const log = new Logger();

export class Vagabond {
  static specialisms(): string[] {
    return ['Improved Initiative', 'Legends', 'Sneak Attack', "Traveller's Luck", 'Vagabond Skills'];
  }

  static async onCreate(item: HVItem): Promise<void> {
    const itemData = item.data as ClassItemData;
    if (itemData.data.specialism) {
      if (!item.actor?.isVagabond()) {
        ui.notifications.error(game.i18n.localize('You must be a vagabond for this specialism'));
        return;
      }
      // TODO implement this properly
      // log.debug(`Vagabond.onCreate() | vagabond-specialism flag set to ${item.name}`);
      // await item.actor?.setFlag('helveczia', 'fighter-specialism', item.name);
      switch (item.name) {
        case 'Vagabond Skills':
          log.debug('Vagabond.onCreate() | vagabond-skills flag set to true');
          item.actor?.setFlag('helveczia', 'vagabond-skills', true);
          break;
      }
    } else {
      log.debug('Vagabond.onCreate() | vagabond-class flag set to true');
      item.actor?.setFlag('helveczia', 'vagabond-class', true);
    }
  }

  static getSkillsBonus(actor: HVActor): number {
    // TODO make this dependent on specialization
    const gainedSkills = actor.isVagabond() && actor.getFlag('helveczia', 'vagabond-skills');
    return gainedSkills ? 4 : 0;
  }

  static async cleanup(actor: HVActor): Promise<void> {
    actor.setFlag('helveczia', 'vagabond-skills', false);
    log.debug('Vagabond.getSkillsBonus() |  vagabond-skills flag set to false');
  }
}
