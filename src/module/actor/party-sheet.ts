import { HVActor } from './actor';
import { HVActorSheet } from './actor-sheet';

export class HVPartySheet extends HVActorSheet {
  static DEFAULT_OPTIONS = {
    classes: ['helveczia', 'party-sheet'],
    position: {
      width: 735,
      height: 550,
    },
    actions: {
      remove: HVPartySheet.remove,
      actor: HVPartySheet.getActorSheet,
    },
    window: {
      resizable: true,
    },
    dragDrop: [{ dragSelector: '.directory-item .actor', dropSelector: null }],
    form: {
      submitOnChange: true,
    },
  };

  static PARTS = {
    header: {
      template: 'systems/helveczia/templates/actor/partials/party-sheet-header.hbs',
    },
    body: {
      template: 'systems/helveczia/templates/actor/partials/party-sheet.hbs',
      scrollable: ['.party-members'],
    },
  };

  async _prepareContext(_options) {
    const party = this._preparePartyData();
    return {
      config: CONFIG.HV,
      user: game.user,
      actor: this.actor,
      party: party,
      virtue: party.length
        ? Math.round(party.map((i) => parseInt(i.system.virtue)).reduce((acc, n) => acc + n, 0) / party.length)
        : 0,
    };
  }

  _preparePartyData(): HVActor[] {
    return game.actors?.filter((a) => (a.getFlag('helveczia', 'party') as string) === this.actor.uuid) ?? [];
  }

  async _addActorToParty(actor: HVActor) {
    if (actor.type === 'party') {
      return;
    }
    await actor.setFlag(game.system.id, 'party', this.actor.uuid);
  }

  static async _removeActorFromParty(actor: HVActor) {
    await actor.unsetFlag(game.system.id, 'party');
  }

  onDropAllow(_actor, data): boolean {
    return data.type === 'Actor';
  }

  async _onDropActor(_event, data): Promise<void> {
    if (!this.actor.isOwner) return;
    const droppedActor = await Actor.implementation.fromDropData(data);
    if (droppedActor) await this._addActorToParty(droppedActor);
    this.render(true);
  }

  static async remove(_event, target) {
    const actorId = target.parentNode.parentNode.parentNode.dataset.actorId;
    const actor = game.actors?.get(actorId);
    if (actor) await HVPartySheet._removeActorFromParty(actor);
    this.render(true);
  }

  static async getActorSheet(_event, target) {
    const actorId = target.dataset.actorId;
    game.actors?.get(actorId)?.sheet?.render(true);
  }
}
