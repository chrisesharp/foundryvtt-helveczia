import { onManageActiveEffect } from '../../effects';
import { HVItemSheet } from '../item-sheet';

export class ClassSheet extends HVItemSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['helveczia', 'sheet', 'item'],
      width: 350,
      height: 450,
      resizable: false,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'editor' }],
    });
  }

  /**
   * Adds skill specific actorsheet listeners.
   */

  /** @override */
  activateListeners(html) {
    // Active Effect management
    html.find('.effect-control').click((ev) => onManageActiveEffect(ev, this));

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
