import { HVActor } from '../documents/actor';
import { HVItem } from '../items/item';
import { Logger } from '../logger';
const { fromUuid } = foundry.utils;

const log = new Logger();
const uuidRegex = new RegExp('(?<actorId>Actor.[a-zA-Z0-9]+)?.?(?<itemId>Item.[a-zA-Z0-9]+)');

type EmbeddedSubject = HVItem | HVActor;

export enum EmbeddedObject {
  Item = 'Item',
  ActiveEffect = 'ActiveEffect',
}

type EmbeddedObjectType = HVItem | ActiveEffect;

const migrations = {
  '3.0.10': migrateTo3_1_0,
  '4.0.5': migrateTo4_0_6,
  '6.0.0': migrateTo6_0_1,
};

export class Utils {
  static async deleteEmbeddedArray(arr: EmbeddedObjectType[], subject: EmbeddedSubject) {
    const docType = arr[0] instanceof Item ? 'Item' : 'ActiveEffect';
    return subject.deleteEmbeddedDocuments(
      docType,
      arr.reduce((acc: string[], p) => {
        if (p.id) acc.push(p.id);
        return acc;
      }, []),
    );
  }

  static async getActorFromUUID(uuid): Promise<HVActor> {
    const obj = await fromUuid(uuid);

    if (obj instanceof TokenDocument) {
      return obj.actor as HVActor;
    }
    return obj as HVActor;
  }

  static getUuidFromLink(link) {
    const groups = link.match(uuidRegex)?.groups;
    const actorId = groups?.actorId;
    const itemId = groups?.itemId;
    return { actorId: actorId, itemId: itemId };
  }

  static canModifyActor(user: StoredDocument<User> | null, actor: HVActor | null): boolean {
    return (
      user != null &&
      actor != null &&
      user.isGM &&
      actor?.testUserPermission(user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
    );
  }

  static migrate() {
    if (!game.user?.isGM) {
      return;
    }

    const currentVersion = game.settings.get('helveczia', 'systemMigrationVersion') as string;
    Object.keys(migrations).forEach(function (key) {
      if (!currentVersion || foundry.utils.isNewerVersion(key, currentVersion)) migrations[key]();
    });
  }

  static findLocalizedPack(pack: string): CompendiumCollection<any> | undefined {
    const label = game.i18n.localize(`HV.packs.${pack}`);
    return game.packs.find((p) => p.metadata.name === pack && p.metadata.label === label);
  }
}

async function migrateTo3_1_0() {
  const options = { permanent: true };
  ui.notifications.warn('Migrating your data to version 3.1.0. Please, wait until it finishes.', options);
  for (const actor of game.actors?.contents) {
    await migrateTo3_1_Actor(actor);
  }
  await game.settings.set('helveczia', 'systemMigrationVersion', game.system.version);
  ui.notifications.info('Data migrated to version 3.1.0.', options);
}

async function migrateTo4_0_6() {
  const options = { permanent: true };
  ui.notifications.warn('Migrating your data to version 4.0.6 Please, wait until it finishes.', options);
  for (const actor of game.actors?.contents) {
    await migrateTo4_0_6_Actor(actor);
  }
  await game.settings.set('helveczia', 'systemMigrationVersion', game.system.version);
  ui.notifications.info('Data migrated to version 4.0.6', options);
}

async function migrateTo6_0_1() {
  const options = { permanent: true };
  ui.notifications.warn('Migrating your data to version 6.0.1. Please wait until it finishes.', options);
  // Rename system.parent → system.parentClass on all world specialism items.
  // In 6.0.0 the pack JSONs used "parent" which is a reserved DataModel property;
  // it was renamed to "parentClass" after the tag. Any item imported at 6.0.0 has
  // the old field name stored in _source and needs it rewritten.
  for (const item of game.items?.contents ?? []) {
    await migrateTo6_0_1_Item(item);
  }
  // Also fix specialisms embedded inside actors.
  for (const actor of game.actors?.contents ?? []) {
    for (const item of actor.items?.contents ?? []) {
      await migrateTo6_0_1_Item(item);
    }
  }
  await game.settings.set('helveczia', 'systemMigrationVersion', game.system.version);
  ui.notifications.info('Data migrated to version 6.0.1.', options);
}

async function migrateTo3_1_Actor(actor: HVActor) {
  if (actor.type != 'character') return;

  const skills = actor.items.filter(
    (i) =>
      i.type === 'skill' &&
      i.name === 'Doctorate' &&
      i.system.subtype === 'magical' &&
      i.getFlag('helveczia', 'locked') === true,
  );
  if (actor.isStudent() && actor.system.level < 6) {
    await actor.setFlag('helveczia', 'student-doctorate', false);
  }
  if (actor.isCleric() && actor.system.level < 6) {
    await actor.setFlag('helveczia', 'cleric-doctorate', false);
  }
  log.debug(`utils.migrateTo3_1_Actor() | updating ${actor.name}`);
  return Utils.deleteEmbeddedArray(skills, actor);
}

async function migrateTo4_0_6_Actor(actor: HVActor) {
  if (actor.type != 'character') return;

  const effects = actor.effects.filter((i) => i.name === 'Sin' || i.name === 'Virtue');
  log.debug(`utils.migrateTo4_0_6_Actor() | updating ${actor.name}`);
  return Utils.deleteEmbeddedArray(effects, actor);
}

async function migrateTo6_0_1_Item(item: HVItem) {
  if (item.type !== 'class') return;
  // Access the raw stored value via _source to bypass the DataModel `parent` accessor.
  const source = (item as any)._source?.system;
  if (!source) return;
  const oldParent = source.parent;
  if (oldParent === undefined || oldParent === null || oldParent === '') return;
  // Only migrate if parentClass is not already set.
  if (source.parentClass) return;
  log.debug(`utils.migrateTo6_0_1_Item() | renaming system.parent → system.parentClass on "${item.name}" (${item.id})`);
  await item.update({ 'system.parentClass': oldParent, 'system.-=parent': null });
}
