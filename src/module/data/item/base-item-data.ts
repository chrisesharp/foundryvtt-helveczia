/**
 * Base Item Data Model
 * Shared fields for all item types in Helvéczia
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const foundry: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { TypeDataModel } = foundry.abstract as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fields = (foundry.data as any).fields;

export class BaseItemData extends TypeDataModel {
  static defineSchema() {
    return {
      description: new fields.HTMLField(),
    };
  }
}
