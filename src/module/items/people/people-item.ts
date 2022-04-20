import { BaseItem } from '../base-item';
import { HVItem, SaveModifier } from '../item';

export class PeopleItem extends BaseItem {
  static get documentName() {
    return 'people';
  }

  /**
   * Adds skill specifig actorsheet listeners.
   */
  static activateActorSheetListeners(html, sheet) {
    super.activateActorSheetListeners(html, sheet);

    // Check or uncheck a single box
    // html.find(".helveczia-possession").click((e) => this._onRollSkill.call(this, e, sheet));
  }

  /** @override */
  static getSaves(item: HVItem): SaveModifier[] {
    console.log('PeopleItem.getSaves():', item);
    return [];
  }
}
