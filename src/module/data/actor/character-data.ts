/**
 * Character Actor Data Model
 * Data model for player character actors
 */

import { BaseActorData } from './base-actor-data';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const foundry: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fields = (foundry.data as any).fields;

export class CharacterData extends BaseActorData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      experience: new fields.NumberField({
        required: true,
        initial: 2000,
        integer: true,
        min: 0,
      }),
      ac: new fields.NumberField({ initial: 10, integer: true }),
      npcModBonus: new fields.NumberField({ initial: 0, integer: true }),
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

    // Convert character-specific numeric fields
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

    return source;
  }
}
