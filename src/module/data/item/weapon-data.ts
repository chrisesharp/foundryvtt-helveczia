/**
 * Weapon Item Data Model
 */

import { BaseItemData } from './base-item-data';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const foundry: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fields = (foundry.data as any).fields;

export class WeaponData extends BaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      attack: new fields.StringField({
        required: true,
        initial: 'melee',
        choices: ['melee', 'ranged', 'cc'],
      }),
      damage: new fields.StringField({ required: true, initial: '1d3', blank: false }),
      critical: new fields.SchemaField({
        range: new fields.StringField({ required: true, initial: '20', blank: false }),
        multiple: new fields.NumberField({ required: true, initial: 2, integer: true, min: 1 }),
      }),
      encumbrance: new fields.NumberField({ required: true, initial: 1, integer: true, min: 0 }),
      bonus: new fields.NumberField({ required: true, initial: 0, integer: true }),
      reload: new fields.NumberField({ required: true, initial: 0, integer: true, min: 0 }),
    };
  }
}
