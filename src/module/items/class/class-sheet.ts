import { onManageActiveEffect } from '../../effects';
import { HVItemSheet } from '../item-sheet';

export class ClassSheet extends HVItemSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['helveczia', 'sheet', 'item'],
      width: 500,
      height: 450,
      resizable: true,
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

    html.find('#specialism').click((ev) => {
      const specialism: boolean = $(ev.currentTarget).is(':checked');
      const parentField = html.find('#parent');
      if (specialism) {
        $(parentField).show();
      } else {
        $(parentField).hide();
      }
    });
  }
}
