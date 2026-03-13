/**
 * Deed Item Data Model
 */

import { BaseItemData } from './base-item-data';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const foundry: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fields = (foundry.data as any).fields;

export class DeedData extends BaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      subtype: new fields.StringField({
        required: true,
        initial: 'sin',
        choices: ['sin', 'virtue'],
      }),
      magnitude: new fields.NumberField({ required: true, initial: 1, integer: true }),
      cardinality: new fields.NumberField({ required: true, initial: 0, integer: true }),
    };
  }
}
