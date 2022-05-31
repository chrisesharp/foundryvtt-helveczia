import { Evaluated } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/foundry.js/roll';
import { HVActor } from '../actor/actor';
import { Logger } from '../logger';

const log = new Logger();

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
            this.scores[key][ability] = (await this.rollAbility()).result;
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

  rollAbility(): Promise<Evaluated<Roll<any>>> {
    return HVCharacterCreator.rollScore(['4d6kh3']);
  }

  rollVirtue(): Promise<Evaluated<Roll<any>>> {
    return HVCharacterCreator.rollScore(['3d6']);
  }

  static async rollHitPoints(actorData) {
    const data = actorData.data;
    const level = data.level;
    const hd = data.hp.hd;
    const con = data.scores.con.mod;
    const rollParts = [`${level - 1}d${hd}`, `${hd}+${con}`, `${con}*${level}`];
    const roll = await HVCharacterCreator.rollScore(rollParts);
    log.debug('Hitpoints rolled for :', actorData.name, rollParts.join('+'), roll.total);
    return {
      max: roll.total,
      value: roll.total,
      roll: roll,
    };
  }

  async rollWealth(): Promise<Evaluated<Roll<any>>> {
    const wealthRoll = await HVCharacterCreator.rollScore(['2d6']);
    return wealthRoll._total < 12 ? wealthRoll : HVCharacterCreator.rollScore(['2d6*100']);
  }

  static rollScore(rollParts): Promise<Evaluated<Roll<any>>> {
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
    const actor = this.object as HVActor;
    const choice = $('#A').prop('checked') ? this.scores.A : this.scores.B;
    const wealth = (await this.rollWealth()).total;
    const virtue = (await this.rollVirtue()).total;
    const updateData = {
      scores: {},
      wealth: {
        th: wealth,
        pf: 0,
        gr: 0,
      },
      virtue: virtue,
      // hp: hitpoints,
    };
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

    const speaker = ChatMessage.getSpeaker({ actor: actor });
    const msg = wealth < 12 ? 'HV.apps.summaryWealth' : 'HV.apps.summaryNoble';
    const summary = game.i18n.format(msg, { virtue: virtue, wealth: wealth });
    const templateData = {
      config: CONFIG.HV,
      scores: choice,
      summary: summary,
      actor: actor,
      title: game.i18n.format('HV.apps.scores', { actor: actor?.name }),
    };
    const content = await renderTemplate('systems/helveczia/templates/chat/roll-creation.hbs', templateData);
    ChatMessage.create({
      content: content,
      speaker,
      blind: true,
    });
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

  static async setOrigins(actor, peopleName, className) {
    const professions = game.packs.find((p) => p.metadata.name == 'classes');
    const peoples = game.packs.find((p) => p.metadata.name == 'peoples');
    const p = await HVCharacterCreator.getDocument(peopleName, peoples);
    const c = await HVCharacterCreator.getDocument(className, professions);
    if (p && c) await actor.createEmbeddedDocuments('Item', [p.toObject(), c.toObject()]);
    // const hitpoints = await this.rollHitPoints(actor.data);
    // const updateData = {
    //   hp: hitpoints,
    // };
    // await actor.update({ data: updateData });
    await actor.setFlag('helveczia', 'origins-initialized', true);
    actor.sheet?.render(true);
  }

  static async setSpecialism(actor, specialismName) {
    const specialisms = game.packs.find((p) => p.metadata.name == 'specialisms');
    const sp = await HVCharacterCreator.getDocument(specialismName, specialisms);
    if (sp) {
      await actor.createEmbeddedDocuments('Item', [sp.toObject()]);
      const hitpoints = await this.rollHitPoints(actor.data);
      const updateData = {
        hp: hitpoints,
      };
      await actor.update({ data: updateData });
      actor.sheet?.render(true);
    }
  }

  static async getDocument(name, pack) {
    const index = await pack?.getIndex();
    const pId = index?.find((p) => p.name === name)?._id;
    if (pId) {
      return pack?.getDocument(pId);
    } else {
      const items = game.items?.filter((i) => i.name === name);
      if (items?.length) {
        return items[0];
      }
    }
  }
}
