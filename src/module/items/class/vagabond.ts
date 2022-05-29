import { HVItem } from '../item';
import { Logger } from '../../logger';
import { HVActor } from '../../actor/actor';
import { ClassItemData, SkillItemData } from '../item-types';

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
      switch (item.name) {
        case 'Vagabond Skills':
          log.debug('Vagabond.onCreate() | vagabond-skills flag set to true');
          item.actor?.setFlag('helveczia', 'vagabond-skills', true);
          break;
        case 'Legends':
          const description =
            'On a successful check, learn something about the selected location, family, organisation, etc.<p>For Normal DC, the information is general; for Hard DC, it is specific; and for Heroic DC, it can extend to obscure secrets).';
          const legendsSkill = {
            name: 'Legend Lore',
            type: 'skill',
            data: {
              description: description,
              ability: 'wis',
              subtype: 'vagabond',
            },
          };
          const itemData = await item.actor?.createEmbeddedDocuments('Item', [legendsSkill]);
          const id = (itemData[0] as Item).id;
          if (id) {
            const i = item.actor?.items.get(id);
            if (i) {
              await i.setFlag('helveczia', 'locked', true);
              await item.actor.update();
            }
          }
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

  static async cleanup(actor: HVActor, item: any): Promise<void> {
    if (item.name === 'Legends') {
      const skills = actor.items.filter(
        (i) => i.type === 'skill' && i.name === 'Legend Lore' && (i.data as SkillItemData).data.subtype === 'vagabond',
      );
      if (skills.length > 0) {
        for (const skill of skills) {
          if (skill.getFlag('helveczia', 'locked') && skill.id) {
            await actor.deleteEmbeddedDocuments('Item', [skill.id]);
          }
        }
      }
    }
    actor.setFlag('helveczia', 'vagabond-skills', false);
    log.debug('Vagabond.getSkillsBonus() |  vagabond-skills flag set to false');
    actor.setFlag('helveczia', 'vagabond-class', false);
    log.debug('Vagabond.getSkillsBonus() |  vagabond-class flag set to false');
    await actor.sheet?.render(true);
  }
}
