import { BaseItem } from '../base-item';

export class SkillItem extends BaseItem {
  static get documentName() {
    return 'skill';
  }

  /**
   * Adds skill specifig actorsheet listeners.
   */
  static activateActorSheetListeners(html, sheet) {
    super.activateActorSheetListeners(html, sheet);

    // Check or uncheck a single box
    html.find('.helveczia-skill').click((e) => this._onRollSkill.call(this, e, sheet));
  }

  static async _onRollSkill(e, sheet) {
    e.preventDefault();

    const dataset = e.currentTarget.dataset;
    const skill = sheet.actor.items.get(dataset.itemId);

    if (skill) {
      // await this.rollSkill(sheet, skill);
    }
  }
}
