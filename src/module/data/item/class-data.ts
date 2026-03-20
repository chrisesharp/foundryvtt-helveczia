/**
 * Class Item Data Model
 */

import { BaseItemData } from './base-item-data';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const foundry: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fields = (foundry.data as any).fields;

export class ClassData extends BaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      specialism: new fields.BooleanField({ required: true, initial: false }),
      parent: new fields.StringField({ initial: '', blank: true }),
    };
  }
}
