import { HVItemSheet } from '../item-sheet';

export class BookSheet extends HVItemSheet {
  static DEFAULT_OPTIONS = {
    classes: ['helveczia', 'sheet', 'item'],
    position: {
      width: 450,
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
      template: 'systems/helveczia/templates/item/book-sheet-header.hbs',
    },
    spells: {
      template: 'systems/helveczia/templates/item/book-sheet-spells.hbs',
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
}
