import { HVItemSheet } from '../item-sheet';

export class ClassSheet extends HVItemSheet {
  static DEFAULT_OPTIONS = {
    classes: ['helveczia', 'sheet', 'item'],
    position: {
      width: 500,
      height: 450,
    },
    actions: {
      toggleEffect: this._effectToggle,
    },
    window: {
      resizable: true,
    },
  };
  static PARTS = {
    header: {
      template: 'systems/helveczia/templates/item/class-sheet-header.hbs',
    },
    notes: {
      template: 'systems/helveczia/templates/item/partials/item-notes.hbs',
    },
    tabs: {
      template: 'systems/helveczia/templates/item/partials/item-nav.hbs',
    },
    effects: {
      template: 'systems/helveczia/templates/item/partials/item-effects.hbs',
    },
  };

  /**
   * Adds skill specific actorsheet listeners.
   */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;
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
