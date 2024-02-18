import { HVCharacterCreator } from '../apps/chargen';
import { onManageActiveEffect } from '../effects';
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

const log = new Logger();

export class HVActorSheet extends ActorSheet {
  /** @override */
  get template() {
    return `systems/helveczia/templates/actor/${this.actor.type}-sheet.hbs`;
  }

  /** @override */
  activateEditor(target, editorOptions, initialContent) {
    // remove some controls to the editor as the space is lacking
    if (target == 'system.description') {
      // 'styles bullist numlist image table hr link removeformat code save'
      editorOptions.toolbar = 'bullist hr link removeFormat save';
      editorOptions.fitToSize = true;
      editorOptions.height = 175;
    }
    super.activateEditor(target, editorOptions, initialContent);
  }

  onDropAllow(_actor, data): boolean {
    // Prevent folders being dragged onto the sheet
    return !(data.type === 'Folder');
  }

  /** @override */
  async _onDrop(event: DragEvent): Promise<void> {
    super._onDrop(event);
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
      const thisActorProfession = this.actor.system.class?.toLowerCase();
      if (thisActorProfession === requiredProfession) {
        if (requiredProfession === 'fighter') {
          log.debug(`_removeClasses() | Removing specialisms for ${thisActorProfession} `);
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
        game.i18n.format('HV.errors.requiredProfession', { requiredProfession: requiredProfession }),
      );
      return false;
    }
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // set character sex
    html.find('.toggle-gender').click(this._toggleGender.bind(this));
    // Item summaries
    html.find('.item .item-name').click((event) => this._onItemSummary(event));

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Roll Hit Points.
    html.find('.hitdie').click(this._onRollHitPoints.bind(this));

    // Seek Guidance.
    html.find('.holy-bible').click((_ev) => {
      CONFIG.HV.applications.holyBible?.seekGuidance(this.actor);
    });

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Character generation to initialize
    html.find('.generate-abilities').click(this._generateAbilities.bind(this));
    html.find('.choose-race-class').click(this._generateRaceClass.bind(this));
    html.find('.choose-specialism').click(this._chooseSpecialism.bind(this));
    html.find('.roll-virtue').click(this.rollVirtue.bind(this));
    html.find('.roll-name').click(this.rollName.bind(this));
    html.find('.generate-craft-skill').click(this._generateCraftSkill.bind(this));
    html.find('.generate-science-skills').click(this._generateScienceSkills.bind(this));
    html.find('.absolution').click(this._onAbsolution.bind(this));

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Update Inventory Item
    html.find('.item-edit').click((ev) => {
      const li = $(ev.currentTarget).parents('.item-entry');
      const item = this.actor.items.get(li.data('item-id'));
      if (item) item.sheet?.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click((ev) => {
      const li = $(ev.currentTarget).parents('.item-entry');
      const itemID = li.data('item-id');
      this.actor.deleteEmbeddedDocuments('Item', [itemID]);
      li.slideUp(200, () => this.render(false));
    });

    // Toggle spell bonus
    html.find('.item-bonus').click(async (ev) => {
      const li = $(ev.currentTarget).parents('.item-entry');
      const itemID = li.data('item-id');
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
    });

    // Toggle spell cast
    html.find('.item-cast').click(async (ev) => {
      const li = $(ev.currentTarget).parents('.item-entry');
      const itemID = li.data('item-id');
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
    });

    // Rememorize spell
    html.find('.item-empty').click(async (ev) => {
      const li = $(ev.currentTarget).parents('.item-entry');
      const itemID = li.data('item-id');
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
          await item.createChatMessage(this.actor, 'HV.SpellLost.short');
        }
      }
    });

    // Active Effect management
    html.find('.effect-control').click((ev) => onManageActiveEffect(ev, this.actor));

    // Sync token with portrait
    html.find('.token-sync').click(async () => {
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
    });
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data,
    };
    // // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data['type'];

    // Finally, create the item!
    return this.actor.createEmbeddedDocuments('Item', [itemData]);
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
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

  async _toggleGender(event) {
    event.preventDefault();
    const sex = this.actor.getFlag('helveczia', 'sex') === 'male' ? 'female' : 'male';
    await this.actor.setFlag('helveczia', 'sex', sex);
  }

  async _onRollHitPoints(event) {
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

  /**
   * Handle adding a summary description for an Item
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemSummary(event) {
    event.preventDefault();
    const li = $(event.currentTarget).parents('.item-entry');
    const item = this.actor.items.get(li.data('item-id'));
    if (!item) return;
    const description = await TextEditor.enrichHTML(item.system.description, { async: true });
    const options = '';

    // Toggle summary
    if (li.hasClass('expanded')) {
      const summary = li.children('.item-summary');
      summary.slideUp(200, () => summary.remove());
    } else {
      // Add item tags
      let tags = `
      <div class="item-summary">`;
      tags += await this._getTags(item);
      tags += `
          <div>
              ${description}
          </div>
          ${options}
      </div>`;
      const div = $(tags);
      li.append(div.hide());
      div.slideDown(200);
    }
    li.toggleClass('expanded');
  }

  _generateAbilities(event) {
    event.preventDefault();
    new HVCharacterCreator(this.actor, {
      top: (this.position.top ?? 0) + 40,
      left: (this.position.left ?? 0) + ((this.position.width ?? 0) - 400) / 2,
    }).render(true);
  }

  async _generateRaceClass(event) {
    event.preventDefault();
    const templateData = {
      peoples: PeopleItem.peoples(),
      classes: ClassItem.classes(),
    };

    const content = await renderTemplate('systems/helveczia/templates/actor/dialogs/choose-origin.hbs', templateData);
    new Dialog(
      {
        title: `${game.i18n.localize('HV.ChooseOriginClass')}`,
        content: content,
        default: 'submit',
        buttons: {
          submit: {
            icon: '<i class="fas fa-check"></i>',
            label: game.i18n.localize('HV.Confirm'),
            callback: async () => {
              const people = $('#orig').val() as string;
              const profession = $('#class').val() as string;
              HVCharacterCreator.setOrigins(this.actor, people, profession);
            },
          },
        },
      },
      {
        classes: ['helveczia', 'helveczia-dialog'],
      },
    ).render(true);
  }

  async _chooseSpecialism(event) {
    event.preventDefault();
    const button = $(event.currentTarget);
    const profession = $(button).data('class');
    const templateData = {
      profession: profession,
      specialisms: ClassItem.specialisms(profession),
    };

    const content = await renderTemplate(
      'systems/helveczia/templates/actor/dialogs/choose-specialism.hbs',
      templateData,
    );
    new Dialog(
      {
        title: `${game.i18n.localize('HV.Choose')} ${game.i18n.localize('HV.Specialism')}`,
        content: content,
        default: 'submit',
        buttons: {
          submit: {
            icon: '<i class="fas fa-check"></i>',
            label: game.i18n.localize('HV.Confirm'),
            callback: async () => {
              const specialism = $('#specialism').val() as string;
              HVCharacterCreator.setSpecialism(this.actor, specialism);
            },
          },
        },
      },
      {
        classes: ['helveczia', 'helveczia-dialog'],
      },
    ).render(true);
  }

  async rollName(event) {
    event.preventDefault();
    const button = $(event.currentTarget);
    const actorId = $(button).data('actorId');
    const actor = game.actors?.get(actorId);
    const sex = (actor?.getFlag('helveczia', 'sex') as string) ?? 'male';
    const people = actor?.system.people?.toLowerCase() ?? 'german';
    const helveczian = false;
    const name = HVNameGenerator.findName(sex, people, helveczian);
    if (name !== '') {
      await actor?.update({ name: name, prototypeToken: { name: name } });
    } else {
      ui.notifications.warn(game.i18n.format('HV.dialog.nameerror', { people: actor?.system.people }));
    }
  }

  async rollVirtue(event) {
    event.preventDefault();
    const button = $(event.currentTarget);
    const actorId = $(button).data('actorId');
    const title = `${game.i18n.localize('HV.RollVirtue')}`;
    const formula = `${this.actor.system.origVirtue}`.match(/(\dd\d[\+\-]?\d*)/g)
      ? this.actor.system.origVirtue
      : '3d6';
    const content = await renderTemplate('systems/helveczia/templates/actor/dialogs/roll-virtue.hbs', {
      formula: formula,
    });
    new Dialog(
      {
        title: title,
        content: content,
        default: 'submit',
        buttons: {
          submit: {
            icon: '<i class="fas fa-check"></i>',
            label: game.i18n.localize('HV.Roll'),
            callback: async () => {
              const actor = game.actors?.get(actorId);
              const rollFormula = $('#formula').val() as string;
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
        },
      },
      {
        classes: ['helveczia', 'helveczia-dialog'],
      },
    ).render(true);
  }

  async getRandomCraft(existingSkills: string[]): Promise<StoredDocument<HVItem> | null> {
    const craftPack = game.packs.find((p) => p.metadata.name === 'crafts');
    return this.getRandomSkill(craftPack, existingSkills);
  }

  async getRandomScience(existingSkills: string[]): Promise<StoredDocument<HVItem> | null> {
    const sciencePack = game.packs.find((p) => p.metadata.name === 'sciences');
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

  async _generateCraftSkill(event) {
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

  async _generateScienceSkills(event) {
    event.preventDefault();
    const existingSkills = (this.actor.system as CharacterActorData).skills.map((i) => i.name);
    existingSkills.push(await this._genRndScienceSkill(1, existingSkills));
    await this._genRndScienceSkill(2, existingSkills);
    await this.actor.update();
  }

  async _genRndScienceSkill(idx, existingSkills): Promise<string | null> {
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

  async _onAbsolution(event) {
    event.preventDefault();
    const sins: HVItem[] = this.actor.system.deeds.filter((d) => d.system.subtype === 'sin');
    const virtues = this.actor.system.deeds.filter((d) => d.system.subtype === 'virtue' && d.system.magnitude > 1);
    const lowVirtue = this.actor.system.virtue < 7;

    if (lowVirtue && virtues.length == 0) {
      ui.notifications.warn(game.i18n.localize('HV.warnings.lowVirtueAbsolution'));
      return;
    }

    const italian = this.actor.isItalian() ? 1 : 0;
    const roll = await new Roll('1d3 + 1 + @italian', { italian: italian }).evaluate({ async: true });

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

  /**
   * Extend and override the sheet header buttons
   * @override
   */
  _getHeaderButtons() {
    const buttons = super._getHeaderButtons().filter((b) => b.class != 'configure-sheet');
    const extras: Application.HeaderButton[] = [];
    if (game.user?.isGM && this.actor.type != 'party') extras.push(HVPDF.getPDFButton(this));
    if (game.user?.isGM && this.actor.type === 'npc') extras.push(NPCGenerator.getButton(this));
    return extras.concat(buttons);
  }
}
