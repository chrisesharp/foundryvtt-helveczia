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
}
