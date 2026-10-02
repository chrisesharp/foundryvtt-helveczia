import { HVActor } from './actor';
import { HVItem } from './item';
import { Logger } from '../logger';
import { SkillData } from '../types/item-types';
import { Utils } from '../utils/utils';

const log = new Logger();

/**
 * Creates a new skill item embedded on `item.actor`, then marks it as locked.
 * Shared by Cleric, Student, and Vagabond onCreate handlers.
 */
export async function createLockedSkill(item: HVItem, skillData: object): Promise<void> {
  const itemData = (await item.actor?.createEmbeddedDocuments('Item', [skillData])) ?? [];
  const id = (itemData[0] as Item).id;
  if (id) {
    const i = item.actor?.items.get(id);
    if (i) {
      await i.setFlag('helveczia', 'locked', true);
      await item.actor?.update({});
    }
  }
}

/**
 * Deletes all locked skill items on `actor` whose name matches `name`
 * and whose `system.subtype` matches `subtype`.
 * Shared by Cleric, Student, and Vagabond cleanup handlers.
 */
export async function deleteLockedSkill(actor: HVActor, name: string, subtype: string): Promise<void> {
  log.debug(`deleteLockedSkill() | deleting "${name}" (subtype: ${subtype})`);
  const skills = actor.items.filter(
    (i) =>
      i.type === 'skill' &&
      i.name === name &&
      (i.system as SkillData).subtype === subtype &&
      i.getFlag('helveczia', 'locked') === true,
  );
  log.debug(`deleteLockedSkill() | matching skills:`, skills);
  await Utils.deleteEmbeddedArray(skills as any, actor);
}
