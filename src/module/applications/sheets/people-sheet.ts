import { HVItemSheet } from './item-sheet';

export class PeopleSheet extends HVItemSheet {
  static readonly DEFAULT_OPTIONS: Record<string, any> = {
    position: {
      width: 375,
      height: 650,
    },
  };
  static readonly PARTS = {
    header: {
      template: 'systems/helveczia/templates/item/partials/people-sheet-header.hbs',
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
