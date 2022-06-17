import { HVItem } from '../item';
import { Logger } from '../../logger';
import { HVActor } from '../../actor/actor';
import { ClassItemData, SkillItemData } from '../item-types';
import { Utils } from '../../utils/utils';

const log = new Logger();

async function deleteSpecialism(actor: HVActor, name: string): Promise<void> {
  log.debug(`Vagabond.deleteSpecialism() | deleting ${name}`);
  const skills = actor.items.filter(
    (i) =>
      i.type === 'skill' &&
      i.name === name &&
      (i.data as SkillItemData).data.subtype === 'vagabond' &&
      i.getFlag('helveczia', 'locked') === true,
  );
  log.debug(`Vagabond.deleteSpecialism() | matching skills:`, skills);
  await Utils.deleteEmbeddedArray(skills, actor);
}

async function createSpecialismSkill(item: HVItem, skillData: any): Promise<void> {
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

export class Vagabond {
  static specialisms(): string[] {
    return ['Improved Initiative', 'Legends', 'Sneak Attack', "Traveller's Luck", 'Vagabond Skills'];
  }

  static async onCreate(item: HVItem): Promise<void> {
    const sourceItemData = item.data as ClassItemData;
    if (sourceItemData.data.specialism) {
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
          const legendDescription =
            'On a successful check, learn something about the selected location, family, organisation, etc.<p>For Normal DC, the information is general; for Hard DC, it is specific; and for Heroic DC, it can extend to obscure secrets).';
          const legendsSkill = {
            name: 'Legends',
            type: 'skill',
            data: {
              description: legendDescription,
              ability: 'wis',
              subtype: 'vagabond',
            },
          };
          createSpecialismSkill(item, legendsSkill);
          break;
        case 'Sneak Attack':
          const sneakDescription =
            'this ability can be used if the character can strike an unaware opponent – e.g. sneaking up on him, stabbing him under a table during conversation, or sniping him from a tree.<p>For every odd level, a successful sneak attack deals an extra +1d6 damage (up to +3d6 on fifth level).<p>Thrown and missile weapons can also be used, and with the right instrument, it can also incapacitate opponents instead of killing them.';
          const sneakSkill = {
            name: 'Sneak Attack',
            type: 'skill',
            data: {
              description: sneakDescription,
              ability: 'dex',
              subtype: 'vagabond',
            },
          };
          createSpecialismSkill(item, sneakSkill);
          break;
        case "Traveller's Luck":
          const luckDescription =
            'Due to Fortune’s attentions, the character can add +2 to a saving throw or initiative roll 1d3 times in a single adventure.<p> The boon can be used before or after declaring the roll; <p>the 1d3 to establish Fortune’s current generosity should be rolled on the first use.';
          const luckSkill = {
            name: item.name,
            type: 'skill',
            data: {
              description: luckDescription,
              ability: 'dex',
              subtype: 'vagabond',
            },
          };
          createSpecialismSkill(item, luckSkill);
          break;
      }
    } else {
      log.debug('Vagabond.onCreate() | vagabond-class flag set to true');
      item.actor?.setFlag('helveczia', 'vagabond-class', true);
    }
  }

  static getSkillsBonus(actor: HVActor): number {
    const gainedSkills = actor.isVagabond() && actor.getFlag('helveczia', 'vagabond-skills');
    return gainedSkills ? 4 : 0;
  }

  static getSaveBase(actor: HVActor): { bravery: number; deftness: number; temptation: number } {
    const base = Math.round(actor.data.data.level / 2);
    return { bravery: base, deftness: base + 2, temptation: base };
  }

  static async cleanup(actor: HVActor, item: any): Promise<void> {
    log.debug(`Vagabond.cleanup() |  cleaning up ${item.name}`);
    if (Vagabond.specialisms().includes(item.name)) {
      log.debug(`Vagabond.cleanup() |  this is a specialism`);
      switch (item.name) {
        case 'Vagabond Skills':
          actor.setFlag('helveczia', 'vagabond-skills', false);
          log.debug('Vagabond.cleanup() |  vagabond-skills flag set to false');
          break;
        case 'Legends':
          deleteSpecialism(actor, item.name);
          break;
        case "Traveller's Luck":
          deleteSpecialism(actor, item.name);
          break;
        case 'Sneak Attack':
          deleteSpecialism(actor, item.name);
          break;
      }
    } else {
      actor.setFlag('helveczia', 'vagabond-class', false);
      log.debug('Vagabond.cleanup() |  vagabond-class flag set to false');
    }
    await actor.sheet?.render(true);
  }
}
