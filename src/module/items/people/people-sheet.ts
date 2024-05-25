import { onManageActiveEffect } from '../../effects';
import { HVItemSheet } from '../item-sheet';

export class PeopleSheet extends HVItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['helveczia', 'sheet', 'item'],
      width: 375,
      height: 650,
      resizable: true,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'editor' }],
    });
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Active Effect management
    html.find('.effect-control').click((ev) => onManageActiveEffect(ev, this.item));
  }
}
