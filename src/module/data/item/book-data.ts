/**
 * Book Item Data Model
 */

import { BaseItemData } from './base-item-data';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const foundry: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fields = (foundry.data as any).fields;

export class BookData extends BaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      cost: new fields.SchemaField({
        value: new fields.NumberField({ required: true, initial: 0, min: 0 }),
        coin: new fields.StringField({ initial: '', blank: true }),
      }),
      encumbrance: new fields.NumberField({ required: true, initial: 1, integer: true, min: 0 }),
      spells: new fields.ArrayField(
        new fields.SchemaField({
          id: new fields.StringField({ blank: true }),
          name: new fields.StringField({ blank: true }),
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
    const pattern = /^@Compendium\[([^\]]+)\.([^\]]+)\]\{([^}]+)\}/;

    if (source.spells.length > 0) {
      for (const item of source.spells) {
        const matched = item.id.match(pattern);
        if (matched) {
          const newId = matched[2];
          const displayName = matched[3];
          item.id = `@UUID[Compendium.helveczia.spells.Item.${newId}]{${displayName}}`;
        }
      }
    }
    return source;
  }
}
