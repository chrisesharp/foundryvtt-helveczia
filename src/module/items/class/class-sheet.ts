import { onManageActiveEffect } from '../../effects';
import { HVItemSheet } from '../item-sheet';

export class ClassSheet extends HVItemSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['helveczia', 'sheet', 'item'],
      width: 350,
      height: 375,
      resizable: false,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'editor' }],
    });
  }
  /**
   * Adds skill specific actorsheet listeners.
   */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Active Effect management
    html.find('.effect-control').click((ev) => onManageActiveEffect(ev, this.item));

    // Check or uncheck a single box
    // html.find(".helveczia-possession").click((e) => this._onRollSkill.call(this, e, sheet));
  }
}
