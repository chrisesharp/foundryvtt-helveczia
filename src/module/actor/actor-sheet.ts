import { HVCharacterCreator } from '../apps/chargen';
import { getActorEffect } from '../effects';
import { ClassItem } from '../items/class/class-item';
import { PeopleItem } from '../items/people/people-item';
import { ClassItemData, DeedItemData, SkillItemData, SpellItemData } from '../items/item-types';
import { Logger } from '../logger';
import { HVItem } from '../items/item';
import { CharacterActorData } from './actor-types';
import { Utils } from '../utils/utils';
import { HVDice } from '../dice';
import { HVNameGenerator } from '../apps/names';
import { HVPDF } from '../pdf';
import { NPCGenerator } from '../apps/npcgen';
import { slideToggle } from '../utils/slide';
const { DialogV2, HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;
const { renderTemplate } = foundry.applications.handlebars;
const { DragDrop, TextEditor } = foundry.applications.ux;
const log = new Logger();

export class HVActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  constructor(options = {}) {
    super(options);
    this.#dragDrop = this.#createDragDropHandlers();
  }

  static DEFAULT_OPTIONS = {
    classes: ['helveczia', 'sheet', 'actor'],
    position: {
      width: 580,
      height: 730,
    },
    actions: {
      toggleGender: this._toggleGender,
      rollHitDie: this._onRollHitPoints,
      itemSummary: this._onItemSummary,
      effectSummary: this._onEffectSummary,
      generateAbilities: this._generateAbilities,
      chooseRaceClass: this._chooseRaceClass,
      chooseSpecialism: this._chooseSpecialism,
      roll: this._onRoll,
      rollVirtue: this._rollVirtue,
      rollName: this._rollName,
      generateCraftSkill: this._generateCraftSkill,
      generateScienceSkill: this._generateScienceSkills,
      absolution: this._onAbsolution,
      itemEdit: this._itemEdit,
      itemDelete: this._itemDelete,
      tokenSync: this._tokenSync,
      toggleEffect: this._effectToggle,
      editEffect: this._effectEdit,
      deleteEffect: this._effectDelete,
      spellBonus: this._spellBonus,
      spellCast: this._spellCast,
      spellEmpty: this._rememorizeSpell,
      printPDF: HVPDF.printSheet,
      importNPC: NPCGenerator.importNPC,
    },
    window: {
      resizable: true,
      // controls: [HVPDF.getPDFButton()],
    },
    // Custom property that's merged into `this.options`
    dragDrop: [{ dragSelector: '[data-drag]', dropSelector: null }],
    form: {
      submitOnChange: true,
    },
  };

  _prepareContext(options) {
    return super._prepareContext(options);
  }

  async _removePeoples(item): Promise<boolean> {
    if (item.name === this.actor.system.people) return false;
    const peoples = this.actor.itemTypes['people'];
    await Utils.deleteEmbeddedArray(peoples, this.actor);
    return true;
  }

  async _removeClasses(item): Promise<boolean> {
    if (item.name === this.actor.system.class) return false;
    const itemData = item.system as ClassItemData;
    if (!itemData.specialism) {
      log.debug('_removeClasses() | Removing previous classes');
      const classes = this.actor.itemTypes['class'];
      await Utils.deleteEmbeddedArray(classes, this.actor);
      return true;
    } else {
      const requiredProfession = itemData.parent?.toLowerCase();
      // const thisActorProfession = this.actor.system.class?.toLowerCase();
      if (this.actor.isNamedType(requiredProfession, 'class')) {
        if (requiredProfession === 'fighter') {
          log.debug(`_removeClasses() | Removing specialisms for ${requiredProfession} `);
          const classes = this.actor.itemTypes['class'].filter(
            (i) =>
              (i.system as ClassItemData).specialism &&
              (i.system as ClassItemData).parent.toLowerCase() === this.actor.system.class.toLowerCase(),
          );
          await Utils.deleteEmbeddedArray(classes, this.actor);
        }
        return true;
      }
      ui.notifications.error(
        game.i18n.format('HV.errors.requiredProfession', {
          requiredProfession: game.i18n.localize(`HV.class.${requiredProfession}`),
        }),
      );
      return false;
    }
  }

  /** @override */
  _onRender(_context, _options) {
    this.#dragDrop.forEach((d) => d.bind(this.element));
    const html = this.element;

    // Seek Guidance.
    html.querySelector('.holy-bible')?.addEventListener('click', (_ev) => {
      CONFIG.HV.applications.holyBible?.seekGuidance(this.actor);
    });
  }

  static _itemEdit(_event, element) {
    const li = element.parentNode.parentNode;
    const item = this.actor.items.get(li.dataset.itemId);
    item?.sheet?.render(true);
  }

  static async _itemDelete(_event, element) {
    const li = element.parentNode.parentNode;
    const itemID = li.dataset.itemId;
    const item = this.actor.items.get(itemID);
    await item.delete();
  }

  static async _tokenSync(_event, _target) {
    const portrait = this.actor.img;
    const path = portrait?.split('/') ?? [];
    let token = '';
    let step;
    while (path.length > 1) {
      step = path.shift();
      token += `${step}/`;
    }

    // eslint-disable-next-line prettier/prettier
    const regex = new RegExp('/assets\/people\/(fe)*male/');
    const match = token.match(regex);
    const extraSubfolder = match ? 'lg/' : '';
    step = path.shift();
    token += `${extraSubfolder}${step}`;
    const data = {
      prototypeToken: {
        texture: {
          src: token,
        },
      },
    };
    await this.actor.update(data);
    ui.notifications.info(game.i18n.localize('HV.TokenSync'));
  }

  static async _effectToggle(_event, target) {
    const effect = this._getEmbeddedDocument(target);
    await effect.update({ disabled: !effect.disabled });
  }

  static async _effectEdit(_event, target) {
    const effect = this._getEmbeddedDocument(target);
    await effect?.sheet.render(true);
  }

  static async _effectDelete(_event, target) {
    const effect = this._getEmbeddedDocument(target);
    await effect.delete();
  }

  static async _spellBonus(_event, target) {
    const li = target.closest('.item-entry');
    const itemID = li.dataset.itemId;
    const item = this.actor.items.get(itemID);
    if (item) {
      const spellLevel = (item.system as SpellItemData).level;
      const state = (item.getFlag('helveczia', 'bonusSpell') as boolean) ?? false;
      const current = (this.actor.getFlag('helveczia', `bonusSpellsChosen-${spellLevel}`) as number) ?? 0;
      if (state !== true) {
        if (current < this.actor.getSpellBonus()[spellLevel - 1]) {
          item.setFlag('helveczia', 'bonusSpell', true);
          await this.actor.setFlag('helveczia', `bonusSpellsChosen-${spellLevel}`, current + 1);
        }
      } else {
        item.setFlag('helveczia', 'bonusSpell', false);
        await this.actor.setFlag('helveczia', `bonusSpellsChosen-${spellLevel}`, Math.max(0, current - 1));
      }
    }
  }

  static async _spellCast(_event, target) {
    const li = target.closest('.item-entry');
    const itemID = li.dataset.itemId;
    const item = this.actor.items.get(itemID);
    if (item) {
      const state = item.getFlag('helveczia', 'castSpell') as boolean;
      if (state !== true) {
        await item.createChatMessage(this.actor, 'HV.SpellCast');
        if (item.getFlag('helveczia', 'bonusSpell') === true) {
          item.setFlag('helveczia', 'castSpell', true);
        } else {
          const spell = item.id ? [item.id] : [];
          await this.actor.deleteEmbeddedDocuments('Item', spell);
        }
      } else {
        ui.notifications.warn(game.i18n.localize('HV.warnings.alreadyCast'));
      }
    }
  }

  static async _rememorizeSpell(_event, target) {
    const li = target.closest('.item-entry');
    const itemID = li.dataset.itemId;
    const item = this.actor.items.get(itemID);
    if (item) {
      const rollData = await this.actor.getRollMods({ roll: 'save', attr: 'temptation' });
      const roll = await this.actor.rollCheck(rollData, {});
      if (roll.total >= roll.data.roll.target) {
        await item.createChatMessage(this.actor, 'HV.SpellRememorize');
        if (item.getFlag('helveczia', 'bonusSpell') === true) {
          item.setFlag('helveczia', 'castSpell', false);
        }
      } else {
        await item.createChatMessage(this.actor, 'HV.SpellLost.abbr');
      }
    }
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  static async _onRoll(event, element) {
    event.preventDefault();
    const dataset = element.dataset;
    let target: { id?: string } = {};
    if (game.user) {
      for (const t of game.user.targets.values()) {
        const actor = t.actor;
        if (actor?._id) {
          target = {
            id: actor._id,
          };
        }
        if (target?.id) break;
      }
    }
    const rollData = await this.actor.getRollMods(dataset);
    this.actor.rollCheck(rollData, target);
  }

  static async _toggleGender(event) {
    event.preventDefault();
    const sex = this.actor.getFlag('helveczia', 'sex') === 'male' ? 'female' : 'male';
    await this.actor.setFlag('helveczia', 'sex', sex);
  }

  static async _onRollHitPoints(event) {
    event.preventDefault();
    const hitpoints = await HVCharacterCreator.rollHitPoints(this.actor);
    const success = this.actor.system.hp.max < hitpoints.max;
    const updateData = {
      hp: {
        value: hitpoints.value,
        max: hitpoints.max,
      },
    };
    const templateData = {
      success: success,
      hitpoints: hitpoints,
      actor: this.actor,
      user: game.user?.id,
      title: game.i18n.format('HV.rolls.hitpoints', { hitpoints: hitpoints.max }),
    };

    const content = await renderTemplate('systems/helveczia/templates/chat/roll-hitpoints.hbs', templateData);
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    await hitpoints.roll.toMessage({ speaker: speaker, flavor: content });
    if (success) {
      await this.actor.update({ system: updateData });
      this.render(true);
    }
    this.actor.setFlag('helveczia', 'rolled-hits-lvl', this.actor.system.level);
  }

  static async _onItemSummary(event, target) {
    event.preventDefault();
    const li = target.parentNode;
    const item = await this.actor.items.get(li.dataset.itemId);
    if (!item) return;
    if (!li.querySelector('.item-summary')) {
      const description = await TextEditor.enrichHTML(item.system.description, { async: true });
      // Add item tags
      let section = `
      <div class="item-summary" style='display:none;'>`;
      section += await this._getTags(item);
      section += `
          <div>
              ${description}
          </div>
      </div>`;
      li.innerHTML += section;
    }
    slideToggle(li.querySelector('.item-summary'));
  }

  static async _onEffectSummary(event, target) {
    event.preventDefault();
    const li = target.parentNode;
    const effect = getActorEffect(this.actor, li.dataset.effectId);
    if (!effect) return;

    // Toggle summary
    if (!li.querySelector('.item-summary')) {
      const keys = effect.changes.map((e) => e.key.replace(/^system\./, '')).join(', ');
      const targets = await TextEditor.enrichHTML(keys, { async: true });
      // Add item tags
      let section = `
      <div class="item-summary" style='display:none;'>`;
      section += `
          <div>
              Affects ${targets}
          </div>
      </div>`;
      li.innerHTML += section;
    }
    slideToggle(li.querySelector('.item-summary'));
  }

  static _generateAbilities(event) {
    event.preventDefault();
    new HVCharacterCreator({
      actor: this.actor,
      top: (this.position.top ?? 0) + 40,
      left: (this.position.left ?? 0) + ((this.position.width ?? 0) - 400) / 2,
    }).render(true);
  }

  static async _chooseRaceClass(event) {
    event.preventDefault();
    const templateData = {
      peoples: PeopleItem.peoples(),
      classes: ClassItem.classes(),
    };

    const content = await renderTemplate('systems/helveczia/templates/actor/dialogs/choose-origin.hbs', templateData);
    DialogV2.wait({
      classes: ['helveczia'],
      window: {
        title: 'HV.ChooseOriginClass',
      },
      modal: true,
      content: content,
      default: 'submit',
      buttons: [
        {
          icon: 'fas fa-check',
          label: 'HV.Confirm',
          action: 'submit',
          callback: async (html) => {
            const people = html?.currentTarget?.querySelector('#orig option:checked').text;
            const profession = html?.currentTarget?.querySelector('#class option:checked').text;
            HVCharacterCreator.setOrigins(this.actor, people, profession);
          },
        },
      ],
      rejectClose: false,
    });
  }

  static async _chooseSpecialism(event, button) {
    event.preventDefault();
    // const button = event.currentTarget;
    const profession = button?.dataset?.class;
    const templateData = {
      profession: profession,
      specialisms: ClassItem.specialisms(profession),
    };

    const content = await renderTemplate(
      'systems/helveczia/templates/actor/dialogs/choose-specialism.hbs',
      templateData,
    );
    DialogV2.wait({
      classes: ['helveczia'],
      window: {
        title: `${game.i18n.localize('HV.Choose')} ${game.i18n.localize('HV.Specialism')}`,
      },
      modal: true,
      content: content,
      default: 'submit',
      buttons: [
        {
          icon: 'fas fa-check',
          label: 'HV.Confirm',
          action: 'submit',
          callback: async (html) => {
            const specialism = html?.currentTarget?.querySelector('#specialism option:checked').text;
            HVCharacterCreator.setSpecialism(this.actor, specialism);
          },
        },
      ],
      rejectClose: false,
    });
  }

  static async _rollName(event, button) {
    event.preventDefault();
    // const button = event.currentTarget;
    const actorId = button?.dataset?.actorId;
    const actor = game.actors?.get(actorId);
    const sex = (actor?.getFlag('helveczia', 'sex') as string) ?? 'male';
    const people = actor?.system.people ?? 'german';
    const helveczian = false;
    const name = HVNameGenerator.findName(sex, people, helveczian);
    if (name !== '') {
      await actor?.update({ name: name, prototypeToken: { name: name } });
    } else {
      ui.notifications.warn(game.i18n.format('HV.dialog.nameerror', { people: actor?.system.people }));
    }
  }

  static async _rollVirtue(event, button) {
    event.preventDefault();
    // const button = event.currentTarget;
    const actorId = button?.dataset?.actorId;
    const title = `${game.i18n.localize('HV.RollVirtue')}`;
    const formula = `${this.actor.system.origVirtue}`.match(/(\dd\d[\+\-]?\d*)/g)
      ? this.actor.system.origVirtue
      : '3d6';
    const content = await renderTemplate('systems/helveczia/templates/actor/dialogs/roll-virtue.hbs', {
      formula: formula,
    });
    DialogV2.wait({
      classes: ['helveczia'],
      window: {
        title: title,
      },
      content: content,
      default: 'submit',
      buttons: [
        {
          icon: 'fas fa-check',
          label: 'HV.Roll',
          action: 'submit',
          callback: async (html) => {
            const actor = game.actors?.get(actorId);
            const rollFormula = html?.currentTarget?.querySelector('#formula').value;
            const rollData = {
              actor: actor,
              roll: {
                blindroll: true,
              },
            };
            const roll = await HVDice.Roll({
              parts: [rollFormula],
              data: rollData,
              skipDialog: true,
              speaker: ChatMessage.getSpeaker({ actor: actor }),
              flavour: title,
              title: title,
              chatMessage: true,
            });
            await actor?.update({ system: { virtue: roll.total, origVirtue: roll.total } });
          },
        },
      ],
      rejectClose: false,
    });
  }

  async getRandomCraft(existingSkills: string[]): Promise<StoredDocument<HVItem> | null> {
    const craftPack = Utils.findLocalizedPack('crafts');
    return this.getRandomSkill(craftPack, existingSkills);
  }

  async getRandomScience(existingSkills: string[]): Promise<StoredDocument<HVItem> | null> {
    const sciencePack = Utils.findLocalizedPack('sciences');
    return this.getRandomSkill(sciencePack, existingSkills);
  }

  async getRandomSkill(pack, existingSkills: string[]): Promise<StoredDocument<HVItem> | null> {
    if (pack) {
      const skillNames = (await pack.getIndex()).map((e) => {
        if (!existingSkills.includes(e.name)) return e._id;
      });
      const skillId = skillNames[Math.floor(Math.random() * skillNames.length)];
      if (skillId) {
        const skill = await pack.getDocument(skillId);
        return skill ? (skill as StoredDocument<HVItem>) : null;
      }
    }
    return null;
  }

  static async _generateCraftSkill(event) {
    event.preventDefault();
    const existingSkills = (this.actor.system as CharacterActorData).skills.map((i) => i.name);
    const rndCraft = await this.getRandomCraft(existingSkills);
    if (rndCraft) {
      const craft = { name: rndCraft?.name, ability: (rndCraft.system as SkillItemData).ability };
      const description = game.i18n.localize('HV.bonusGermanCraftSkill');
      const skill = {
        name: craft.name,
        type: 'skill',
        system: {
          ability: craft.ability,
          subtype: 'craft',
          bonus: 2,
          description: description,
        },
      };
      const itemData = await this.actor.createEmbeddedDocuments('Item', [skill]);
      const id = (itemData[0] as Item).id;
      if (id) {
        const item = this.actor.items.get(id);
        if (item) {
          await item.setFlag('helveczia', 'locked', true);
          await this.actor.setFlag('helveczia', 'german-skill-generated', skill.name);
          await this.actor.update();
        }
      }
    }
  }

  static async _generateScienceSkills(event) {
    event.preventDefault();
    const existingSkills = (this.actor.system as CharacterActorData).skills.map((i) => i.name);
    existingSkills.push(await HVActorSheet._genRndScienceSkill(1, existingSkills));
    await HVActorSheet._genRndScienceSkill(2, existingSkills);
    await this.actor.update();
  }

  static async _genRndScienceSkill(idx, existingSkills): Promise<string | null> {
    const rndSkill = await this.getRandomScience(existingSkills);
    if (rndSkill != null) {
      const skillData = { name: rndSkill.name, ability: (rndSkill.system as SkillItemData).ability };
      const description = game.i18n.localize('HV.bonusStudentScienceSkill');
      const skill = {
        name: skillData.name,
        type: 'skill',
        system: {
          ability: skillData.ability,
          subtype: 'science',
          bonus: 0,
          description: description,
        },
      };
      const itemData = await this.actor.createEmbeddedDocuments('Item', [skill]);
      const id = (itemData[0] as Item).id;
      if (id) {
        const item = this.actor.items.get(id);
        if (item) {
          await item.setFlag('helveczia', 'locked', true);
          const flag = `student-skill-generated-${idx}`;
          await this.actor.setFlag('helveczia', flag, skill.name);
          log.debug(`getRndScienceSkill() | Set flag: ${flag} to ${this.actor.getFlag('helveczia', flag)}`);
        }
        return rndSkill.name;
      }
    }
    return null;
  }

  async _getTags(item: HVItem): Promise<string> {
    return CONFIG.HV.itemClasses[item.type] ? CONFIG.HV.itemClasses[item.type].getTags(item, this.actor) : '';
  }

  static async _onAbsolution(event) {
    event.preventDefault();
    const sins: HVItem[] = this.actor.system.deeds.filter((d) => d.system.subtype === 'sin');
    const virtues = this.actor.system.deeds.filter((d) => d.system.subtype === 'virtue' && d.system.magnitude > 1);
    const lowVirtue = this.actor.system.virtue < 7;

    if (lowVirtue && virtues.length == 0) {
      ui.notifications.warn(game.i18n.localize('HV.warnings.lowVirtueAbsolution'));
      return;
    }

    const italian = this.actor.isItalian() ? 1 : 0;
    const roll = await new Roll('1d3 + 1 + @italian', { italian: italian }).evaluate();

    const absolved: HVItem[] = [];
    let absolvedTotal = 0;

    while (sins.length > 0) {
      const sin = sins.shift();
      if (sin) {
        const mag: number = Math.floor((sin?.system as DeedItemData).magnitude);
        if (absolvedTotal + mag <= roll.total) {
          absolvedTotal += mag;
          absolved.push(sin);
        }
      }
    }

    await Utils.deleteEmbeddedArray(absolved, this.actor);

    const templateData = {
      success: absolved.length > 0,
      roll: roll,
      actor: this.actor,
      user: game.user?.id,
      absolved: absolved,
      cardinalSins: CONFIG.HV.cardinalSins,
    };

    const content = await renderTemplate('systems/helveczia/templates/chat/roll-absolution.hbs', templateData);
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    await roll.toMessage({ speaker: speaker, flavor: content });
  }

  /** The following pieces set up drag handling and are unlikely to need modification  */

  /**
   * Returns an array of DragDrop instances
   * @type {DragDrop[]}
   */
  get dragDrop() {
    return this.#dragDrop;
  }

  // This is marked as private because there's no real need
  // for subclasses or external hooks to mess with it directly
  #dragDrop;

  /**
   * Create drag-and-drop workflow handlers for this Application
   * @returns {DragDrop[]}     An array of DragDrop handlers
   * @private
   */
  #createDragDropHandlers() {
    return this.options.dragDrop.map((d) => {
      d.permissions = {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this),
      };
      d.callbacks = {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this),
      };
      return new DragDrop(d);
    });
  }

  onDropAllow(_actor, data): boolean {
    // Prevent folders being dragged onto the sheet
    return !(data.type === 'Folder');
  }

  async _onDropItem(event, data) {
    if (!this.actor.isOwner) return false;
    const item = await Item.implementation.fromDropData(data);

    // Handle item sorting within the same Actor
    if (this.actor.uuid === item.parent?.uuid) return this._onSortItem(event, item);

    // Create the owned item
    return this._onDropItemCreate(item, event);
  }

  /**
   * Handle the final creation of dropped Item data on the Actor.
   * This method is factored out to allow downstream classes the opportunity to override item creation behavior.
   * @param {object[]|object} itemData      The item data requested for creation
   * @param {DragEvent} event               The concluding DragEvent which provided the drop data
   * @returns {Promise<Item[]>}
   * @private
   */
  async _onDropItemCreate(itemData, _event) {
    itemData = itemData instanceof Array ? itemData : [itemData];
    return this.actor.createEmbeddedDocuments('Item', itemData);
  }

  _getEmbeddedDocument(target) {
    const docRow = target.closest('div.item');
    console.log(docRow.dataset);
    if (docRow.dataset.documentClass === 'Item') {
      return this.actor.items.get(docRow.dataset.itemId);
    } else if (docRow.dataset.documentClass === 'ActiveEffect') {
      const parent =
        docRow.dataset.parentId === this.actor.id ? this.actor : this.actor.items.get(docRow?.dataset.parentId);
      return parent?.effects.get(docRow?.dataset.effectId);
    } else return console.warn('Could not find document class');
  }
}
