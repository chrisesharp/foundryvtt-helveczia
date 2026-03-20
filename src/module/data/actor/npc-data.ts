/**
 * NPC Actor Data Model
 * Data model for non-player character actors
 */

import { BaseActorData } from './base-actor-data';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const foundry: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fields = (foundry.data as any).fields;

export class NPCData extends BaseActorData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      levelBonus: new fields.StringField({ required: true, initial: '1' }),
      baseAC: new fields.NumberField({ required: true, initial: 10, integer: true }),
      experience: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
      ac: new fields.NumberField({ initial: 10, integer: true }),
      npcModBonus: new fields.NumberField({ initial: 0, integer: true }),
      stats: new fields.SchemaField({
        saves: new fields.SchemaField({
          bravery: new fields.NumberField({ initial: 0, integer: true }),
          deftness: new fields.NumberField({ initial: 0, integer: true }),
          temptation: new fields.NumberField({ initial: 0, integer: true }),
        }),
      }),
    };
  }

  /**
   * Migrate source data from some prior format into a new specification.
   * @param {object} source     Candidate source data
   * @returns {object}          Migrated source data
   */
  static migrateData(source: any): any {
    // First apply base migrations
    source = super.migrateData(source);

    // Convert NPC-specific numeric fields
    if (source.baseAC !== undefined && typeof source.baseAC === 'string') {
      const num = Number(source.baseAC);
      if (!isNaN(num)) {
        source.baseAC = num;
      }
    }

    if (source.experience !== undefined && typeof source.experience === 'string') {
      const num = Number(source.experience);
      if (!isNaN(num)) {
        source.experience = num;
      }
    }

    if (source.ac !== undefined && typeof source.ac === 'string') {
      const num = Number(source.ac);
      if (!isNaN(num)) {
        source.ac = num;
      }
    }

    if (source.npcModBonus !== undefined && typeof source.npcModBonus === 'string') {
      const num = Number(source.npcModBonus);
      if (!isNaN(num)) {
        source.npcModBonus = num;
      }
    }

    // Convert stats.saves numeric fields
    if (source.stats?.saves) {
      ['bravery', 'deftness', 'temptation'].forEach((save) => {
        if (source.stats.saves[save] !== undefined && typeof source.stats.saves[save] === 'string') {
          const num = Number(source.stats.saves[save]);
          if (!isNaN(num)) {
            source.stats.saves[save] = num;
          }
        }
      });
    }

    return source;
  }
}
