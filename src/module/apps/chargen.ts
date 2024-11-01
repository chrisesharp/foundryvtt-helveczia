import { Evaluated } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/dice/roll';
import { HVActor } from '../actor/actor';
import { Logger } from '../logger';
import { Utils } from '../utils/utils';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const log = new Logger();

export class HVCharacterCreator extends HandlebarsApplicationMixin(ApplicationV2) {
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

  private scores = { A: this.A, B: this.B };
  private actor: HVActor;

  static DEFAULT_OPTIONS = {
    id: 'character-creator',
    classes: ['helveczia'],
    form: {
      handler: HVCharacterCreator._onSubmit,
      closeOnSubmit: true,
    },

    tag: 'form',
    position: {
      width: 235,
    },
    window: {
      resizable: false,
      title: 'HV.apps.chargen',
      contentClasses: ['standard-form', 'helveczia', 'dialog', 'creator'],
    },
    actor: null,
  };

  static PARTS = {
    helveczia: {
      template: 'systems/helveczia/templates/actor/dialogs/character-creation.hbs',
    },
    footer: {
      template: 'templates/generic/form-footer.hbs',
    },
  };

  constructor({ actor, ...options }) {
    super(options);
    this.actor = actor;
  }

  /**
   * Add the Entity name into the window title
   * @type {String}
   */
  get title() {
    return game.i18n.localize(this.options.window.title);
  }
  /**
   * Construct and return the data object used to render the HTML template for this form application.
   * @return {Object}
  //  */
  protected async _prepareContext(_options): Promise<EmptyObject> {
    await this.generateOptions();
    const scores = { A: this.A, B: this.B };
    return {
      buttons: [{ type: 'submit', icon: 'fa-solid fa-save', label: 'HV.Choose' }],
      user: game.user,
      config: CONFIG.HV,
      scores: scores,
    };
  }

  generateOptions() {
    const options = ['A', 'B'];
    const stats = ['str', 'int', 'dex', 'wis', 'con', 'cha'];
    return Promise.all(
      options.map(async (key) => {
        await Promise.all(
          stats.map(async (ability) => {
            this.scores[key][ability] = (await this.rollAbility()).result;
          }),
        );
      }),
    );
  }

  rollAbility(): Promise<Evaluated<Roll<any>>> {
    return HVCharacterCreator.rollScore(['4d6kh3']);
  }

  rollVirtue(): Promise<Evaluated<Roll<any>>> {
    return HVCharacterCreator.rollScore(['3d6']);
  }

  static async rollHitPoints(actorData) {
    const data = actorData.system;
    const level = data.level;
    const hd = data.hp.hd;
    const con = data.scores.con.mod;
    const rollParts = [`${level - 1}d${hd}`, `${hd}+${con}`, `${con}*${level - 1}`];
    if (data.npcModBonus > 0) {
      rollParts.push(`${level}*${data.npcModBonus}`);
    }
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
    return new Roll(rollParts.join('+'), data).evaluate();
  }

  static async _onSubmit(event: Event): Promise<any> {
    event.preventDefault();
    const choice = this.element.querySelector('#A').checked ? this.scores.A : this.scores.B;
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
      origVirtue: virtue,
    };
    Object.keys(choice).forEach((key) => {
      updateData.scores[key] = {
        value: choice[key],
        base: choice[key],
      };
    });
    this._updateActor(event, updateData);

    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const msg = wealth < 12 ? 'HV.apps.summaryWealth' : 'HV.apps.summaryNoble';
    const summary = game.i18n.format(msg, { virtue: virtue, wealth: wealth });
    const templateData = {
      config: CONFIG.HV,
      scores: choice,
      summary: summary,
      actor: this.actor,
      title: game.i18n.format('HV.apps.scores', { actor: this.actor?.name }),
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
  async _updateActor(event: Event, formData: object) {
    event.preventDefault();
    await this.actor.update({ system: formData });
    await this.actor.setFlag('helveczia', 'abilities-initialized', true);

    // // Re-draw the updated sheet
    this.actor?.sheet?.render(true);
  }

  static async setOrigins(actor, peopleName, className) {
    await HVCharacterCreator.setPeoples(actor, peopleName, false);
    await HVCharacterCreator.setProfession(actor, className, false);
    await actor.setFlag('helveczia', 'origins-initialized', true);
    actor.sheet?.render(true);
  }

  static async setPeoples(actor, peopleName, render = true) {
    const peoples = Utils.findLocalizedPack('peoples');
    const p = await HVCharacterCreator.getDocument(peopleName, peoples);
    if (p) await actor.createEmbeddedDocuments('Item', [p.toObject()]);
    actor.sheet?.render(render);
  }

  static async setProfession(actor, className, render = true) {
    const professions = Utils.findLocalizedPack('classes');
    const c = await HVCharacterCreator.getDocument(className, professions);
    if (c) await actor.createEmbeddedDocuments('Item', [c.toObject()]);
    actor.sheet?.render(render);
  }

  static async setSpecialism(actor, specialismName, render = true) {
    const specialisms = Utils.findLocalizedPack('specialisms');
    const sp = await HVCharacterCreator.getDocument(specialismName, specialisms);
    if (sp) {
      await actor.createEmbeddedDocuments('Item', [sp.toObject()]);
      const hitpoints = await this.rollHitPoints(actor);
      const updateData = {
        hp: hitpoints,
      };
      await actor.update({ system: updateData });
      actor.sheet?.render(render);
    }
  }

  static async getDocument(name, ...packs) {
    for (const pack of packs) {
      if (pack) {
        const index = await pack?.getIndex();
        const pId = index?.find((p) => p.name === name)?._id;
        if (pId) {
          return pack?.getDocument(pId);
        }
      }
    }
    const items = game.items?.filter((i) => i.name === name);
    if (items?.length) {
      return items[0];
    }
  }
}
