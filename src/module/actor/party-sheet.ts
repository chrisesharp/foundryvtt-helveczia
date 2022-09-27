import { HVActor } from './actor';
import { HVActorSheet } from './actor-sheet';
import { PartyActorData } from './actor-types';

export class HVPartySheet extends HVActorSheet {
  static get defaultOptions() {
    const width = game.user?.isGM ? 735 : 450;
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['helveczia', 'party-sheet'],
      template: 'systems/helveczia/templates/party/party-sheet.hbs',
      width: width,
      height: 350,
      resizable: true,
      dragDrop: [{ dragSelector: '.directory-item .actor', dropSelector: null }],
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'summary' }],
    });
  }

  async getData() {
    const baseData = await super.getData();
    const actorData = baseData.actor.data as PartyActorData;
    const data: any = {
      config: CONFIG.HV,
      user: game.user,
      actor: actorData,
      party: this._preparePartyData(),
    };
    return data;
  }

  _preparePartyData(): HVActor[] {
    return game.actors?.filter((a) => (a.getFlag('helveczia', 'party') as string) === this.actor.uuid) ?? [];
  }

  async _addActorToParty(actor: HVActor) {
    if (actor.type !== 'character') {
      return;
    }
    await actor.setFlag(game.system.id, 'party', this.actor.uuid);
  }

  async _removeActorFromParty(actor: HVActor) {
    await actor.unsetFlag(game.system.id, 'party');
  }

  onDropAllow(_actor, data): boolean {
    return data.type === 'Actor';
  }

  /** @override */
  async _onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    let data;
    try {
      data = JSON.parse(event.dataTransfer?.getData('text/plain') ?? '');

      switch (data.type) {
        case 'Actor':
          this._onDropActor(event, data);
      }
    } catch (err) {
      // noop
    }
  }

  async _onDropActor(_event, data): Promise<void> {
    if (data.type !== 'Actor') {
      return;
    }

    const droppedActor = game.actors?.get(data.id);
    if (droppedActor) await this._addActorToParty(droppedActor);
    this.render();
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find('a.resync').click(() => this.render(true));

    html.find('a.remove').click(async (ev) => {
      const actorId = ev.currentTarget.parentElement.parentElement.parentElement.dataset.actorId;
      const actor = game.actors?.get(actorId);
      if (actor) await this._removeActorFromParty(actor);
      this.render();
    });

    html.find('img.profile-img').click((ev) => {
      const actorId = ev.currentTarget.parentElement.parentElement.parentElement.dataset.actorId;
      game.actors?.get(actorId)?.sheet?.render(true);
    });
  }
}
