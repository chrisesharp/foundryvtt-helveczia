/**
 * NPC Actor Data Model
 * Data model for non-player character actors
 */

import { BaseActorData, coerceNum } from './base-actor-data';

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
    source = super.migrateData(source);
    coerceNum(source, 'baseAC', 'experience', 'ac', 'npcModBonus');

    // stats.saves sub-object
    if (source.stats?.saves) {
      coerceNum(source.stats.saves, 'bravery', 'deftness', 'temptation');
    }

    return source;
  }
}
