import { HVItemSheet } from './item-sheet';

export class WeaponSheet extends HVItemSheet {
  static readonly DEFAULT_OPTIONS: Record<string, any> = {
    position: {
      width: 470,
      height: 470,
    },
  };
  static readonly PARTS = {
    header: {
      template: 'systems/helveczia/templates/item/partials/weapon-sheet-header.hbs',
    },
    damage: {
      template: 'systems/helveczia/templates/item/partials/weapon-sheet-damage.hbs',
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
