import { HVItemSheet } from './item-sheet';

export class SpellSheet extends HVItemSheet {
  static readonly DEFAULT_OPTIONS: Record<string, any> = {
    position: {
      width: 450,
      height: 450,
    },
  };
  static readonly PARTS = {
    header: {
      template: 'systems/helveczia/templates/item/partials/spell-sheet-header.hbs',
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
