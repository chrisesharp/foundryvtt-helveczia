/**
 * Container Item Data Model
 */

import { BaseItemData } from './base-item-data';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const foundry: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fields = (foundry.data as any).fields;

export class ContainerData extends BaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      cost: new fields.SchemaField({
        value: new fields.NumberField({ required: true, initial: 0, min: 0 }),
        coin: new fields.StringField({ initial: '', blank: true }),
      }),
      encumbrance: new fields.NumberField({ required: true, initial: 1, integer: true, min: 0 }),
      capacity: new fields.NumberField({ required: true, initial: 8, integer: true, min: 0 }),
      contents: new fields.ArrayField(
        new fields.SchemaField({
          id: new fields.StringField({ blank: true }),
          name: new fields.StringField({ blank: true }),
          encumbrance: new fields.NumberField({ required: true, integer: true, min: 0 }),
        }),
        { initial: [] },
      ),
    };
  }

  /**
   * Migrate source data from some prior format into a new specification.
   * This is called automatically when initializing the data model.
   * @param {object} source  Candidate source data
   * @returns {object}       Migrated source data
   */
  static migrateData(source: any): any {
    if (source.contents.length > 0) {
      for (const item of source.contents) {
        if (item.encumbrance === undefined || item.encumbrance === null) {
          item.encumbrance = 1;
        }
      }
    }
    return source;
  }
}
