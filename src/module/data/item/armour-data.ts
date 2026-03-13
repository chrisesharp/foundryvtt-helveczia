/**
 * Armour Item Data Model
 */

import { BaseItemData } from './base-item-data';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const foundry: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fields = (foundry.data as any).fields;

export class ArmourData extends BaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      bonus: new fields.NumberField({ required: true, initial: 0, integer: true }),
      encumbrance: new fields.NumberField({ required: true, initial: 1, integer: true, min: 0 }),
      shield: new fields.BooleanField({ required: true, initial: false }),
    };
  }
}
