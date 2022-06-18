import { HVActorSheet } from './actor-sheet';

export class HVCharacterSheet extends HVActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['helveczia', 'sheet', 'actor', 'character'],
      template: 'systems/helveczia/templates/actor/character-sheet.hbs',
      width: 580,
      height: 730,
      resizable: true,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'abilities' }],
    });
  }
}
