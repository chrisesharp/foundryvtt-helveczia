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

      // These are populated by prepareDerivedData in actor.ts
      possessions: new fields.ObjectField({ initial: { articles: [], weapons: [], armour: [] } }),
      skills: new fields.ArrayField(new fields.ObjectField(), { initial: [] }),
      peoples: new fields.ArrayField(new fields.ObjectField(), { initial: [] }),
      classes: new fields.ArrayField(new fields.ObjectField(), { initial: [] }),
      specialisms: new fields.ArrayField(new fields.ObjectField(), { initial: [] }),
      deeds: new fields.ArrayField(new fields.ObjectField(), { initial: [] }),
      sins: new fields.ArrayField(new fields.ObjectField(), { initial: [] }),
      virtues: new fields.ArrayField(new fields.ObjectField(), { initial: [] }),
      spells: new fields.ArrayField(new fields.ArrayField(new fields.ObjectField()), { initial: [[], [], []] }),
      capacity: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    };
  }

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
    // Convert string numbers to actual numbers for all numeric fields
    const numericFields = ['virtue', 'initiative', 'maxskills', 'level', 'capacity'];

    for (const field of numericFields) {
      if (source[field] !== undefined && typeof source[field] === 'string') {
        const num = Number(source[field]);
        if (!isNaN(num)) {
          source[field] = num;
        }
      }
    }

    // Convert nested numeric fields
    if (source.hp) {
      ['value', 'max', 'hd'].forEach((field) => {
        if (source.hp[field] !== undefined && typeof source.hp[field] === 'string') {
          const num = Number(source.hp[field]);
          if (!isNaN(num)) {
            source.hp[field] = num;
          }
        }
      });
    }

    // Convert scores
    if (source.scores) {
      ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach((ability) => {
        if (source.scores[ability]) {
          ['value', 'base'].forEach((field) => {
            if (source.scores[ability][field] !== undefined && typeof source.scores[ability][field] === 'string') {
              const num = Number(source.scores[ability][field]);
              if (!isNaN(num)) {
                source.scores[ability][field] = num;
              }
            }
          });
        }
      });
    }

    // Convert saves
    if (source.saves) {
      ['bravery', 'deftness', 'temptation'].forEach((save) => {
        if (source.saves[save]) {
          ['base', 'bonus', 'mod'].forEach((field) => {
            if (source.saves[save][field] !== undefined && typeof source.saves[save][field] === 'string') {
              const num = Number(source.saves[save][field]);
              if (!isNaN(num)) {
                source.saves[save][field] = num;
              }
            }
          });
        }
      });
    }

    // Convert attack values
    if (source.attack) {
      ['melee', 'ranged', 'cc'].forEach((attackType) => {
        if (source.attack[attackType]) {
          ['base', 'bonus', 'mod'].forEach((field) => {
            if (
              source.attack[attackType][field] !== undefined &&
              typeof source.attack[attackType][field] === 'string'
            ) {
              const num = Number(source.attack[attackType][field]);
              if (!isNaN(num)) {
                source.attack[attackType][field] = num;
              }
            }
          });
        }
      });
    }

    // Convert wealth
    if (source.wealth) {
      ['th', 'pf', 'gr'].forEach((field) => {
        if (source.wealth[field] !== undefined && typeof source.wealth[field] === 'string') {
          const num = Number(source.wealth[field]);
          if (!isNaN(num)) {
            source.wealth[field] = num;
          }
        }
      });
    }

    return source;
  }
}
