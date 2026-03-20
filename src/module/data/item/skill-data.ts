/**
 * Skill Item Data Model
 */

import { BaseItemData } from './base-item-data';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const foundry: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fields = (foundry.data as any).fields;

export class SkillData extends BaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      ability: new fields.StringField({
        required: true,
        initial: '',
        blank: true,
        choices: ['', 'str', 'dex', 'con', 'int', 'wis', 'cha'],
      }),
      subtype: new fields.StringField({ initial: '', blank: true }),
      bonus: new fields.NumberField({ required: true, initial: 0, integer: true }),
    };
  }
}
