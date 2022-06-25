import { prepareActiveEffectCategories } from '../effects';
import { Logger } from '../logger';
import { HVActorSheet } from './actor-sheet';

const log = new Logger();

export class HVNPCSheet extends HVActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['helveczia', 'sheet', 'actor', 'npc'],
      template: 'systems/helveczia/templates/actor/npc-sheet.hbs',
      width: 580,
      height: 730,
      resizable: true,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'combat' }],
    });
  }

  /** @override */
  async getData() {
    const baseData = await super.getData();
    const actorData = baseData.actor;
    const data: any = {
      owner: this.actor.isOwner,
      options: this.options,
      editable: this.isEditable,
      isToken: this.token && !this.token.data.actorLink,
      config: CONFIG.HV,
      user: game.user,
      classes: this.actor.data.data.classes,
    };
    // Add actor, actor data and item
    data.actor = actorData.data;
    data.data = data.actor.data;
    data.items = this.actor.items.map((i) => i.data);
    data.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    data.possessions = data.data.possessions;
    data.effects = prepareActiveEffectCategories(this.actor.effects);
    return data;
  }

  /** @override */
  async _calculateAvailableSlots(): Promise<any> {
    const worn = 24;
    const carried = 0;
    const mount = 0;
    log.debug(`NPC._calculateAvailableSlots() | slots are worn:${worn}, carried: ${carried}, mount:${mount}`);
    return {
      worn: worn,
      carried: carried,
      mount: mount,
    };
  }
}
