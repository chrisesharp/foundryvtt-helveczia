import { HVActor } from '../../actor/actor';
import { HVParty } from './party';

type PartyType = {
  party?: HVParty;
  sheet?: HVPartySheet;
};

const Party: PartyType = {};

export class HVPartySheet extends FormApplication {
  static init(party: HVParty) {
    Party.party = party;
    Party.sheet = new HVPartySheet(party);
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['helveczia', 'party-sheet'],
      template: 'systems/helveczia/templates/party/party-sheet.hbs',
      width: 735,
      height: 350,
      resizable: true,
      dragDrop: [{ dragSelector: '.directory-item .actor', dropSelector: null }],
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'summary' }],
    });
  }

  static get sheet() {
    return Party.sheet;
  }

  /**
   * Add the Entity name into the window title
   * @type {String}
   */
  get title() {
    return game.i18n.localize('HV.dialog.partysheet.name');
  }

  static showSheet(options?: Application.RenderOptions<FormApplicationOptions> | undefined): unknown {
    if (Party.sheet) return (Party.sheet as HVPartySheet)?.render(true, options);
    return;
  }

  getData(
    _options?: Partial<FormApplicationOptions> | undefined,
    // eslint-disable-next-line @typescript-eslint/ban-types
  ): FormApplication.Data<{}, FormApplicationOptions> | Promise<FormApplication.Data<{}, FormApplicationOptions>> {
    const party = Party.party?.members;
    const options: FormApplicationOptions = foundry.utils.mergeObject(
      {
        baseApplication: this,
      },
      _options,
    );

    const data = {
      title: this.title,
      object: this.object,
      data: this.object,
      party: party,
      //   abilities: abilities,
      //   possessions: possessions,
      config: CONFIG.HV,
      user: game.user,
      options: options,
    };
    return data;
  }

  /**
   * This method is called upon form submission after form data is validated
   * @param event {Event}       The initial triggering submission event
   * @param formData {Object}   The object of validated form data with which to update the object
   * @private
   */
  async _updateObject(event: Event, _formData: object) {
    event.preventDefault();
  }

  async _addActorToParty(actor: HVActor) {
    if (actor.type !== 'character') {
      return;
    }
    await actor.setFlag(game.system.id, 'party', true);
  }

  async _removeActorFromParty(actor: HVActor) {
    await actor.setFlag(game.system.id, 'party', false);
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

    // const droppedActor = (await fromUuid(data.uuid)) as HVActor;
    const droppedActor = game.actors?.get(data.id);
    if (droppedActor) await this._addActorToParty(droppedActor);
    Party.party?.update(droppedActor, {});
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
      Party.party?.update(actor, {});
      this.render();
    });

    html.find('img.profile-img').click((ev) => {
      const actorId = ev.currentTarget.parentElement.parentElement.parentElement.dataset.actorId;
      game.actors?.get(actorId)?.sheet?.render(true);
    });
  }
}
