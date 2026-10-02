/**
 * Character Actor Data Model
 * Data model for player character actors
 */

import { BaseActorData, coerceNum } from './base-actor-data';

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
    source = super.migrateData(source);
    coerceNum(source, 'experience', 'ac', 'npcModBonus');
    return source;
  }
}
