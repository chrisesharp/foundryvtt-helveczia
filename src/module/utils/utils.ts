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

// async function migrateToSchemas() {
//   const options = { permanent: true };
//   ui.notifications.warn(
//     'Migrating your data to Schema-based data models (v5.3.0). Please wait until it finishes.',
//     options,
//   );

//   // Migrate all actors
//   log.info('Migrating actors to schemas...');
//   for (const actor of game.actors?.contents ?? []) {
//     try {
//       const updateData = migrateActorToSchema(actor);
//       if (!foundry.utils.isEmpty(updateData)) {
//         await actor.update(updateData, { enforceTypes: false });
//         log.debug(`Migrated actor: ${actor.name}`);
//       }
//     } catch (err) {
//       log.error(`Error migrating Actor ${actor.name}:`, err);
//     }
//   }

//   // Migrate all items
//   log.info('Migrating items to schemas...');
//   for (const item of game.items?.contents ?? []) {
//     try {
//       const updateData = migrateItemToSchema(item);
//       if (!foundry.utils.isEmpty(updateData)) {
//         await item.update(updateData, { enforceTypes: false });
//         log.debug(`Migrated item: ${item.name}`);
//       }
//     } catch (err) {
//       log.error(`Error migrating Item ${item.name}:`, err);
//     }
//   }

//   // Migrate actors in all scenes
//   log.info('Migrating scene actors to schemas...');
//   for (const scene of game.scenes?.contents ?? []) {
//     for (const token of scene.tokens?.contents ?? []) {
//       if (token.actor) {
//         try {
//           const updateData = migrateActorToSchema(token.actor);
//           if (!foundry.utils.isEmpty(updateData)) {
//             await token.actor.update(updateData, { enforceTypes: false });
//             log.debug(`Migrated scene actor: ${token.actor.name}`);
//           }
//         } catch (err) {
//           log.error(`Error migrating scene Actor ${token.actor.name}:`, err);
//         }
//       }
//     }
//   }

//   // Migrate compendium packs
//   log.info('Migrating compendium packs to schemas...');
//   for (const pack of game.packs ?? []) {
//     if (pack.documentName === 'Actor' || pack.documentName === 'Item') {
//       try {
//         await migrateCompendiumToSchema(pack);
//       } catch (err) {
//         log.error(`Error migrating compendium ${pack.collection}:`, err);
//       }
//     }
//   }

//   await game.settings.set('helveczia', 'systemMigrationVersion', '5.3.0');
//   ui.notifications.info('Data migrated to Schema-based data models (v5.3.0).', options);
//   log.info('Schema migration complete!');
// }

// function migrateActorToSchema(actor: HVActor): Record<string, unknown> {
//   const updateData: Record<string, unknown> = {};

//   // Convert string numbers to actual numbers for fields that require it
//   const system = actor.system as any;

//   // Convert numeric fields that might be stored as strings
//   const numericFields = [
//     'virtue',
//     'initiative',
//     'maxskills',
//     'level',
//     'hp.value',
//     'hp.max',
//     'hp.hd',
//     'scores.str.value',
//     'scores.str.base',
//     'scores.dex.value',
//     'scores.dex.base',
//     'scores.con.value',
//     'scores.con.base',
//     'scores.int.value',
//     'scores.int.base',
//     'scores.wis.value',
//     'scores.wis.base',
//     'scores.cha.value',
//     'scores.cha.base',
//     'saves.bravery.base',
//     'saves.bravery.bonus',
//     'saves.bravery.mod',
//     'saves.deftness.base',
//     'saves.deftness.bonus',
//     'saves.deftness.mod',
//     'saves.temptation.base',
//     'saves.temptation.bonus',
//     'saves.temptation.mod',
//     'attack.melee.base',
//     'attack.melee.bonus',
//     'attack.melee.mod',
//     'attack.ranged.base',
//     'attack.ranged.bonus',
//     'attack.ranged.mod',
//     'attack.cc.base',
//     'attack.cc.bonus',
//     'attack.cc.mod',
//     'wealth.th',
//     'wealth.pf',
//     'wealth.gr',
//     'capacity',
//   ];

//   for (const field of numericFields) {
//     const value = getProperty(system, field);
//     if (value !== undefined && typeof value === 'string') {
//       const numValue = Number(value);
//       if (!isNaN(numValue)) {
//         updateData[`system.${field}`] = numValue;
//       }
//     }
//   }

//   // Type-specific migrations
//   if (actor.type === 'character') {
//     if (system.experience === undefined) {
//       updateData['system.experience'] = 2000;
//     } else if (typeof system.experience === 'string') {
//       updateData['system.experience'] = Number(system.experience) || 2000;
//     }
//     if (system.ac === undefined) {
//       updateData['system.ac'] = 10;
//     } else if (typeof system.ac === 'string') {
//       updateData['system.ac'] = Number(system.ac) || 10;
//     }
//     if (system.npcModBonus === undefined) {
//       updateData['system.npcModBonus'] = 0;
//     } else if (typeof system.npcModBonus === 'string') {
//       updateData['system.npcModBonus'] = Number(system.npcModBonus) || 0;
//     }
//   } else if (actor.type === 'npc') {
//     if (system.levelBonus === undefined) {
//       updateData['system.levelBonus'] = '1';
//     }
//     if (system.baseAC === undefined) {
//       updateData['system.baseAC'] = 10;
//     } else if (typeof system.baseAC === 'string') {
//       updateData['system.baseAC'] = Number(system.baseAC) || 10;
//     }
//     if (system.ac === undefined) {
//       updateData['system.ac'] = 10;
//     } else if (typeof system.ac === 'string') {
//       updateData['system.ac'] = Number(system.ac) || 10;
//     }
//     if (system.npcModBonus === undefined) {
//       updateData['system.npcModBonus'] = 0;
//     } else if (typeof system.npcModBonus === 'string') {
//       updateData['system.npcModBonus'] = Number(system.npcModBonus) || 0;
//     }
//     if (system.experience === undefined) {
//       updateData['system.experience'] = 0;
//     } else if (typeof system.experience === 'string') {
//       updateData['system.experience'] = Number(system.experience) || 0;
//     }
//   } else if (actor.type === 'party') {
//     if (system.members === undefined) {
//       updateData['system.members'] = [];
//     }
//   }

//   return updateData;
// }

// // Helper function to get nested property
// function getProperty(obj: any, path: string): any {
//   return path.split('.').reduce((current, prop) => current?.[prop], obj);
// }

// function migrateItemToSchema(_item: HVItem): Record<string, unknown> {
//   const updateData: Record<string, unknown> = {};

//   // The template.json structure is already compatible with our schemas
//   // Add any necessary data transformations here if needed

//   return updateData;
// }

// async function migrateCompendiumToSchema(pack: CompendiumCollection<any>): Promise<void> {
//   const documentName = pack.documentName;
//   if (!['Actor', 'Item'].includes(documentName)) return;

//   log.info(`Migrating compendium to schemas: ${pack.collection}`);

//   // Unlock the pack for editing
//   const wasLocked = pack.locked;
//   await pack.configure({ locked: false });

//   // Get all documents
//   const documents = await pack.getDocuments();

//   // Migrate each document
//   for (const doc of documents) {
//     try {
//       let updateData: Record<string, unknown> = {};

//       if (documentName === 'Actor') {
//         updateData = migrateActorToSchema(doc as HVActor);
//       } else if (documentName === 'Item') {
//         updateData = migrateItemToSchema(doc as HVItem);
//       }

//       if (!foundry.utils.isEmpty(updateData)) {
//         await doc.update(updateData, { enforceTypes: false });
//         log.debug(`Migrated compendium document: ${doc.name}`);
//       }
//     } catch (err) {
//       log.error(`Error migrating compendium document ${doc.name}:`, err);
//     }
//   }

//   // Re-lock the pack if it was locked
//   if (wasLocked) {
//     await pack.configure({ locked: true });
//   }

//   log.info(`Compendium migration complete: ${pack.collection}`);
// }
