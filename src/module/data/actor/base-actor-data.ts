import type { HVItem } from '../../documents/item';

/**
 * Base Actor Data Model
 * Shared fields for all actor types in Helvéczia
 */

// Declare foundry global for TypeScript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const foundry: any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { TypeDataModel } = foundry.abstract as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fields = (foundry.data as any).fields;

/**
 * Coerces the given keys on `source` from string to number in-place.
 * Keys that are already numbers, undefined, or non-numeric strings are left unchanged.
 */
export function coerceNum(source: Record<string, any>, ...keys: string[]): void {
  for (const key of keys) {
    if (source[key] !== undefined && typeof source[key] === 'string') {
      const n = Number(source[key]);
      if (!Number.isNaN(n)) source[key] = n;
    }
  }
}

export class BaseActorData extends TypeDataModel {
  static defineSchema() {
    return {
      description: new fields.HTMLField(),

      hp: new fields.SchemaField({
        value: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
        max: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
        hd: new fields.NumberField({ required: true, initial: 8, integer: true, min: 1 }),
      }),

      level: new fields.NumberField({ required: true, initial: 1, integer: true, min: 1 }),
      people: new fields.StringField({ initial: '' }),
      class: new fields.StringField({ initial: '' }),
      origVirtue: new fields.StringField({ required: true, initial: '10' }),
      virtue: new fields.NumberField({ required: true, initial: 10, integer: true }),
      initiative: new fields.NumberField({ required: true, initial: 0, integer: true }),
      maxskills: new fields.NumberField({ required: true, initial: 3, integer: true }),

      saves: new fields.SchemaField({
        bravery: new fields.SchemaField({
          base: new fields.NumberField({ initial: 0, integer: true }),
          bonus: new fields.NumberField({ initial: 0, integer: true }),
          mod: new fields.NumberField({ initial: 0, integer: true }),
        }),
        deftness: new fields.SchemaField({
          base: new fields.NumberField({ initial: 0, integer: true }),
          bonus: new fields.NumberField({ initial: 0, integer: true }),
          mod: new fields.NumberField({ initial: 0, integer: true }),
        }),
        temptation: new fields.SchemaField({
          base: new fields.NumberField({ initial: 0, integer: true }),
          bonus: new fields.NumberField({ initial: 0, integer: true }),
          mod: new fields.NumberField({ initial: 0, integer: true }),
        }),
      }),

      attack: new fields.SchemaField({
        melee: new fields.SchemaField({
          base: new fields.NumberField({ initial: 0, integer: true }),
          bonus: new fields.NumberField({ initial: 0, integer: true }),
          mod: new fields.NumberField({ initial: 0, integer: true }),
        }),
        ranged: new fields.SchemaField({
          base: new fields.NumberField({ initial: 0, integer: true }),
          bonus: new fields.NumberField({ initial: 0, integer: true }),
          mod: new fields.NumberField({ initial: 0, integer: true }),
        }),
        cc: new fields.SchemaField({
          base: new fields.NumberField({ initial: 0, integer: true }),
          bonus: new fields.NumberField({ initial: 0, integer: true }),
          mod: new fields.NumberField({ initial: 0, integer: true }),
        }),
      }),

      scores: new fields.SchemaField({
        str: new fields.SchemaField({
          value: new fields.NumberField({ required: true, initial: 10, integer: true, min: 0, max: 18 }),
          base: new fields.NumberField({ required: true, initial: 10, integer: true, min: 0, max: 18 }),
        }),
        dex: new fields.SchemaField({
          value: new fields.NumberField({ required: true, initial: 10, integer: true, min: 0, max: 18 }),
          base: new fields.NumberField({ required: true, initial: 10, integer: true, min: 0, max: 18 }),
        }),
        con: new fields.SchemaField({
          value: new fields.NumberField({ required: true, initial: 10, integer: true, min: 0, max: 18 }),
          base: new fields.NumberField({ required: true, initial: 10, integer: true, min: 0, max: 18 }),
        }),
        int: new fields.SchemaField({
          value: new fields.NumberField({ required: true, initial: 10, integer: true, min: 0, max: 18 }),
          base: new fields.NumberField({ required: true, initial: 10, integer: true, min: 0, max: 18 }),
        }),
        wis: new fields.SchemaField({
          value: new fields.NumberField({ required: true, initial: 10, integer: true, min: 0, max: 18 }),
          base: new fields.NumberField({ required: true, initial: 10, integer: true, min: 0, max: 18 }),
        }),
        cha: new fields.SchemaField({
          value: new fields.NumberField({ required: true, initial: 10, integer: true, min: 0, max: 18 }),
          base: new fields.NumberField({ required: true, initial: 10, integer: true, min: 0, max: 18 }),
        }),
      }),

      wealth: new fields.SchemaField({
        th: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
        pf: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
        gr: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
      }),
    };
  }

  // Derived item lists — populated by HVActor._categoriseItems() during prepareDerivedData().
  // These are NOT schema fields and are never persisted to the database.
  declare possessions: { articles: HVItem[]; weapons: HVItem[]; armour: HVItem[] };
  declare skills: HVItem[];
  declare peoples: HVItem[];
  declare classes: HVItem[];
  declare specialisms: HVItem[];
  declare deeds: HVItem[];
  declare sins: HVItem[];
  declare virtues: HVItem[];
  declare spells: HVItem[][];
  declare capacity: number;

  prepareDerivedData() {
    // Derived data is calculated in actor.ts _prepareCharacterData() and _prepareNPCData()
  }

  /**
   * Migrate source data from some prior format into a new specification.
   * This is called automatically when initializing the data model.
   * @param {object} source  Candidate source data
   * @returns {object}       Migrated source data
   */
  static migrateData(source: any): any {
    coerceNum(source, 'virtue', 'initiative', 'maxskills', 'level');

    if (source.hp) coerceNum(source.hp, 'value', 'max', 'hd');

    if (source.scores) {
      BaseActorData.migrateScores(source);
    }

    if (source.saves) {
      BaseActorData.migrateSaves(source);
    }

    if (source.attack) {
      BaseActorData.migrateAttacks(source);
    }

    if (source.wealth) coerceNum(source.wealth, 'th', 'pf', 'gr');

    return source;
  }

  static migrateScores(source: any) {
    for (const ability of ['str', 'dex', 'con', 'int', 'wis', 'cha']) {
      if (source.scores[ability]) coerceNum(source.scores[ability], 'value', 'base');
    }
  }

  static migrateSaves(source: any) {
    for (const save of ['bravery', 'deftness', 'temptation']) {
      if (source.saves[save]) coerceNum(source.saves[save], 'base', 'bonus', 'mod');
    }
  }

  static migrateAttacks(source: any) {
    for (const type of ['melee', 'ranged', 'cc']) {
      if (source.attack[type]) coerceNum(source.attack[type], 'base', 'bonus', 'mod');
    }
  }
}
