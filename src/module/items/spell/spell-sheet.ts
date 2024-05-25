import { HVItemSheet } from '../item-sheet';

export class SpellSheet extends HVItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['helveczia', 'sheet', 'item'],
      width: 450,
      height: 450,
      resizable: true,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'editor' }],
    });
  }
}
