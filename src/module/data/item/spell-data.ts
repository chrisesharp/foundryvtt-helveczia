/**
 * Spell Item Data Model
 */

import { BaseItemData } from './base-item-data';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const foundry: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fields = (foundry.data as any).fields;

export class SpellData extends BaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      level: new fields.NumberField({ required: true, initial: 1, integer: true, min: 1, max: 3 }),
      class: new fields.StringField({ initial: '', blank: true }),
      range: new fields.StringField({ initial: '', blank: true }),
      duration: new fields.StringField({ initial: '', blank: true }),
      area: new fields.StringField({ initial: '', blank: true }),
      save: new fields.StringField({ initial: '', blank: true }),
      component: new fields.StringField({ initial: '', blank: true }),
    };
  }
}
