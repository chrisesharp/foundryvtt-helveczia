import { HVItem } from '../item';
import { Logger } from '../../logger';
import { HVActor } from '../../actor/actor';
import { ClassItemData, SkillItemData } from '../item-types';
import { Utils } from '../../utils/utils';

const log = new Logger();

const clericSpecialisms = {
  Spells: {
    description: `All Clerics who follow the rules and
    remains remain obedient lambs of the faith
    may learn spells at places held holy by the
    Mother Church. The maximal number of
    spells someone can learn depends on the
    Cleric’s level, while specific spells are tied
    to their places of origin: a humble chapel
    might only have one or two, while a cloister
    or cathedral could have many powerful
    ones. Once used, spells are lost, and need to
    be relearned. Only the rare relics of the
    saints allow someone to replenish a spell
    freely. Beginning characters start with a
    random spell selection.`,
    flag: 'cleric-spells',
  },
  Exorcism: {
    description: `With the word of God, Clerics
    can command infernal creatures, e.g. devils,
    evil spirits, vampires, etc. to stop their
    hauntings and flee. This ability can be used
    one time per adventure (twice from the
    fifth level). The targets must roll a Temptation
    saving throw or flee in panic.`,
    flag: 'cleric-exorcism',
  },
  Healing: {
    description: `If the Cleric does not fill his or her
    mind with spells, unused slots can be used
    for healing instead. The power of healing is
    1d6, 2d6 or 3d6 Hp depending on the spell
    level. This power returns after Sunday mass.
    Spells which have already been learned cannot
    be converted to healing.`,
    flag: 'cleric-healing',
  },
};

async function deleteSpecialistSkill(actor: HVActor, name: string): Promise<void> {
  log.debug(`Cleric.deleteSpecialistSkill() | deleting ${name}`);
  const skills = actor.items.filter(
    (i) =>
      i.type === 'skill' &&
      i.name === name &&
      (i.data as SkillItemData).data.subtype === 'magical' &&
      (i as HVItem).getFlag('helveczia', 'locked') === true,
  );
  log.debug(`Cleric.deleteSpecialistSkill() | matching skills:`, skills);
  await Utils.deleteEmbeddedArray(skills, actor);
}

async function createSpecialistSkill(item: HVItem, skillData: any): Promise<void> {
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

export class Cleric {
  static specialisms(): string[] {
    return Object.keys(clericSpecialisms);
  }

  static async onCreate(item: HVItem): Promise<void> {
    const actor = item.actor;
    const sourceItemData = item.data as ClassItemData;
    if (sourceItemData.data.specialism) {
      if (!actor?.isCleric()) {
        ui.notifications.error(game.i18n.localize('You must be a cleric for this specialism'));
        return;
      }
    } else {
      log.debug('Cleric.onCreate() | cleric-class flag set to true');
      actor?.setFlag('helveczia', 'cleric-class', true);
      Promise.all(
        Object.keys(clericSpecialisms).map((s) => {
          const skill = {
            name: s,
            type: 'skill',
            data: {
              description: clericSpecialisms[s].description,
              ability: '',
              subtype: 'magical',
            },
          };
          actor?.setFlag('helveczia', clericSpecialisms[s].flag, true);
          return createSpecialistSkill(item, skill);
        }),
      );
    }
  }

  static getSkillsBonus(actor: HVActor): number {
    const gainedSixthLevelSkills = actor.isCleric() && actor.data.data.level == 6;
    actor.setFlag('helveczia', 'cleric-skill', gainedSixthLevelSkills);
    log.debug('Cleric.getSkillsBonus() |  cleric-skill flag set to ', gainedSixthLevelSkills);
    return gainedSixthLevelSkills ? 6 : 0;
  }

  static getSaveBase(actor: HVActor): { bravery: number; deftness: number; temptation: number } {
    const base = Math.round(actor.data.data.level / 2);
    return { bravery: base + 2, deftness: base, temptation: base + 2 };
  }

  static getSpellSlots(actor: HVActor): number[] {
    const level = actor.data.data.level;
    const bonus = actor.data.data.scores.wis.value;
    const spells = duplicate(CONFIG.HV.spellSlots[level]);
    if (bonus >= 12) spells[0] += 1;
    if (bonus >= 15) spells[1] += 1;
    if (bonus >= 18) spells[2] += 1;
    log.debug(`Cleric.getSpellSlots() | WIS of ${bonus} results in `, spells);
    return spells;
  }

  static async cleanup(actor: HVActor, _item: any): Promise<void> {
    Promise.all(
      Object.keys(clericSpecialisms).map((s) => {
        actor?.setFlag('helveczia', clericSpecialisms[s].flag, false);
        return deleteSpecialistSkill(actor, s);
      }),
    );
    log.debug('Cleric.cleanup() |  cleric-skill flag set to false');
    actor.setFlag('helveczia', 'cleric-skill', false);
    log.debug('Cleric.cleanup() |  cleric-class flag set to false');
    actor.setFlag('helveczia', 'cleric-class', false);
  }
}
