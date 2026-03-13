/**
 * Party Actor Data Model
 * Data model for party management actors
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const foundry: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { TypeDataModel } = foundry.abstract as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fields = (foundry.data as any).fields;

export class PartyData extends TypeDataModel {
  static defineSchema() {
    return {
      members: new fields.ArrayField(
        new fields.DocumentUUIDField(), // Actor UUIDs
        { initial: [] },
      ),
    };
  }
}
