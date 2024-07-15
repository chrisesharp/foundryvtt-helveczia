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
      (i.system as SkillItemData).subtype === 'vagabond' &&
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
  // eslint-disable-next-line @typescript-eslint/ban-types
  static specialisms(): {} {
    const keys = ['improvedInitiative', 'legends', 'sneak', 'luck', 'vagabondSkills'];
    return keys.reduce((dict, p) => {
      dict[p] = game.i18n.localize(`HV.specialisms.vagabond.${p}`);
      return dict;
    }, {});
  }

  static specialistSkills(): string[] {
    return ['legends', 'sneak', 'luck'];
  }

  static async onCreate(item: HVItem): Promise<void> {
    const sourceItemData = item.system as ClassItemData;
    if (sourceItemData.specialism) {
      if (!item.actor?.isVagabond()) {
        ui.notifications.error(
          game.i18n.format('HV.errors.requiredProfession', {
            requiredProfession: game.i18n.localize('HV.class.vagabond'),
          }),
        );
        return;
      }
      const specialisms = Vagabond.specialisms();
      let foundName: string | undefined;
      for (const s in specialisms) {
        if (specialisms[s] === item.name) foundName = s;
      }
      switch (foundName) {
        case 'vagabondSkills':
          log.debug('Vagabond.onCreate() | vagabond-skills flag set to true');
          item.actor?.setFlag('helveczia', 'vagabond-skills', true);
          break;
        case 'legends':
          const legendDescription = game.i18n.localize('HV.vagabond.legends');
          const legendsSkill = {
            name: game.i18n.localize(`HV.specialisms.vagabond.${foundName}`),
            type: 'skill',
            system: {
              description: legendDescription,
              ability: 'wis',
              subtype: 'vagabond',
            },
          };
          createSpecialismSkill(item, legendsSkill);
          break;
        case 'sneak':
          const sneakDescription = game.i18n.localize('HV.vagabond.sneakAttack');
          const sneakSkill = {
            name: game.i18n.localize(`HV.specialisms.vagabond.${foundName}`),
            type: 'skill',
            system: {
              description: sneakDescription,
              ability: 'dex',
              subtype: 'vagabond',
            },
          };
          createSpecialismSkill(item, sneakSkill);
          break;
        case 'luck':
          const luckDescription = game.i18n.localize('HV.vagabond.travellersLuck');
          const luckSkill = {
            name: game.i18n.localize(`HV.specialisms.vagabond.${foundName}`),
            type: 'skill',
            system: {
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
    // 2 base specialist skills + 4 from vagabond skills + 1 from 5th level
    const base = Vagabond.hasSpecialistSkills(actor);
    const gainedSkills = actor.isVagabond() && actor.getFlag('helveczia', 'vagabond-skills') ? 4 : 0;
    const levelSkill = actor.isVagabond() && actor.system.level >= 5 ? 1 : 0;
    return base + gainedSkills + levelSkill;
  }

  static hasSpecialistSkills(actor: HVActor): number {
    const specialistSkills = Vagabond.specialistSkills().map((s) => game.i18n.localize(`HV.specialisms.vagabond.${s}`));
    const bonuses = actor.system.specialisms.filter((i) => specialistSkills.includes(i.name)).length;
    return bonuses;
  }

  static getSaveBase(actor: HVActor): { bravery: number; deftness: number; temptation: number } {
    const base = Math.floor(actor.system.level / 2);
    return { bravery: base, deftness: base + 2, temptation: base };
  }

  static async cleanup(actor: HVActor, item: any): Promise<void> {
    log.debug(`Vagabond.cleanup() |  cleaning up ${item.name}`);
    const specialisms = Vagabond.specialisms();
    let foundName;
    for (const s in specialisms) {
      if (specialisms[s] === item.name) foundName = s;
    }
    if (foundName) {
      log.debug(`Vagabond.cleanup() |  this is a specialism`);
      switch (foundName) {
        case 'vagabondSkills':
          actor.setFlag('helveczia', 'vagabond-skills', false);
          log.debug('Vagabond.cleanup() |  vagabond-skills flag set to false');
          break;
        case 'legends':
          deleteSpecialism(actor, item.name);
          break;
        case 'luck':
          deleteSpecialism(actor, item.name);
          break;
        case 'sneak':
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
