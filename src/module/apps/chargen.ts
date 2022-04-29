import { Evaluated } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/foundry.js/roll';
import { HVActor } from '../actor/actor';

export class HVCharacterCreator extends FormApplication {
  A = {
    str: 0,
    wis: 0,
    dex: 0,
    int: 0,
    cha: 0,
    con: 0,
  };

  B = {
    str: 0,
    wis: 0,
    dex: 0,
    int: 0,
    cha: 0,
    con: 0,
  };

  scores = { A: this.A, B: this.B };

  static get defaultOptions() {
    const options = super.defaultOptions;
    (options.classes = ['helveczia', 'dialog', 'creator']), (options.id = 'character-creator');
    options.template = 'systems/helveczia/templates/actor/dialogs/character-creation.hbs';
    options.width = 235;
    return options;
  }

  /**
   * Add the Entity name into the window title
   * @type {String}
   */
  get title() {
    return game.i18n.localize('HV.apps.chargen');
  }
  /**
   * Construct and return the data object used to render the HTML template for this form application.
   * @return {Object}
   */
  async getData() {
    const data: any = foundry.utils.deepClone(super.getData());
    data.user = game.user;
    data.config = CONFIG.HV;
    await this.generateOptions();
    data.scores = { A: this.A, B: this.B };
    return data;
  }

  generateOptions() {
    const options = ['A', 'B'];
    const stats = ['str', 'int', 'dex', 'wis', 'con', 'cha'];
    return Promise.all(
      options.map(async (key) => {
        Promise.all(
          stats.map(async (ability) => {
            this.scores[key][ability] = (await this.rollScore()).result;
          }),
        );
      }),
    );
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.find('button.choice').click((_ev) => {
      this.submit();
    });
  }

  rollScore(): Promise<Evaluated<Roll<any>>> {
    const rollParts = ['4d6kh3'];
    const data = {
      roll: {
        type: 'result',
      },
    };
    // Roll and return
    return new Roll(rollParts.join('+'), data).evaluate({ async: true });
  }

  async _onSubmit(event: Event): Promise<any> {
    event.preventDefault();
    const choice = $('#A').prop('checked') ? this.scores.A : this.scores.B;
    const updateData = { scores: {} };
    Object.keys(choice).forEach((key) => {
      updateData.scores[key] = {
        value: choice[key],
        base: choice[key],
      };
    });
    super._onSubmit(event, {
      updateData: updateData,
      preventClose: false,
      preventRender: false,
    });
    const speaker = ChatMessage.getSpeaker({ actor: this.object as HVActor });
    const actor = game.actors?.get(speaker.actor ?? '');
    const templateData = {
      config: CONFIG.HV,
      scores: choice,
      actor: actor,
      title: game.i18n.format('HV.apps.scores', { actor: actor?.name }),
    };
    const content = await renderTemplate('systems/helveczia/templates/chat/roll-creation.hbs', templateData);
    ChatMessage.create({
      content: content,
      speaker,
      blind: true,
    });
    // this.object.createEmbeddedDocuments("Item", [itemData]);
  }

  /**
   * This method is called upon form submission after form data is validated
   * @param event {Event}       The initial triggering submission event
   * @param formData {Object}   The object of validated form data with which to update the object
   * @private
   */
  async _updateObject(event: Event, formData: object) {
    event.preventDefault();
    const actor = this.object as HVActor;
    // // Update the actor
    await actor.update({ data: formData });
    await actor.setFlag('helveczia', 'abilities-initialized', true);

    // // Re-draw the updated sheet
    actor?.sheet?.render(true);
  }
}
