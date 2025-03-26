import { HVItemSheet } from '../item-sheet';

export class WeaponSheet extends HVItemSheet {
  static DEFAULT_OPTIONS = {
    classes: ['helveczia', 'sheet', 'item'],
    position: {
      width: 470,
      height: 470,
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
      template: 'systems/helveczia/templates/item/weapon-sheet-header.hbs',
    },
    damage: {
      template: 'systems/helveczia/templates/item/weapon-sheet-damage.hbs',
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
