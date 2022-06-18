import { HVItemSheet } from '../item-sheet';

export class WeaponSheet extends HVItemSheet {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['helveczia', 'sheet', 'item'],
      width: 470,
      height: 470,
      resizable: true,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'damage' }],
    });
  }
}
