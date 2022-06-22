import { HVCharacterCreator } from '../apps/chargen';
import { onManageActiveEffect, prepareActiveEffectCategories } from '../effects';
import { ClassItem } from '../items/class/class-item';
import { PeopleItem } from '../items/people/people-item';
import { ClassItemData, DeedItemData, SkillItemData, SpellItemData } from '../items/item-types';
import { Logger } from '../logger';
import { HVItem } from '../items/item';
import { CharacterActorData } from './actor-types';
import { HVActor } from './actor';
import { Utils } from '../utils/utils';

const log = new Logger();

export class HVActorSheet extends ActorSheet {
  /** @override */
  get template() {
    return `systems/helveczia/templates/actor/${this.actor.data.type}-sheet.hbs`;
  }

  /** @override */
  activateEditor(target, editorOptions, initialContent) {
    // remove some controls to the editor as the space is lacking
    if (target == 'data.description') {
      editorOptions.toolbar = 'styleselect bullist hr table removeFormat save';
    }
    super.activateEditor(target, editorOptions, initialContent);
  }

  /** @override */
  async getData() {
    const baseData = await super.getData();
    const actorData = baseData.actor;
    const data: any = {
      owner: this.actor.isOwner,
      initialized:
        this.actor.getFlag('helveczia', 'abilities-initialized') &&
        this.actor.getFlag('helveczia', 'origins-initialized'),
      no_abilities: !this.actor.getFlag('helveczia', 'abilities-initialized'),
      no_origins: !this.actor.getFlag('helveczia', 'origins-initialized'),
      german_skill: this.actor.getFlag('helveczia', 'german-skill'),
      german_skill_generated: this.actor.getFlag('helveczia', 'german-skill-generated'),
      czech_skill: this.actor.getFlag('helveczia', 'czech-skill'),
      dutch_skill: this.actor.getFlag('helveczia', 'dutch-skill'),
      vagabond_skills: this.actor.getFlag('helveczia', 'vagabond-skills'),
      fighter_class: this.actor.getFlag('helveczia', 'fighter-class'),
      vagabond_class: this.actor.getFlag('helveczia', 'vagabond-class'),
      cleric_class: this.actor.isCleric(),
      fighter_specialism: this.actor.getFlag('helveczia', 'fighter-specialism'),
      fighter_third_skill: this.actor.getFlag('helveczia', 'fighter-third-skill'),
      fighter_fifth_skill: this.actor.getFlag('helveczia', 'fighter-fifth-skill'),
      student_class: this.actor.getFlag('helveczia', 'student-class'),
      student_skill: this.actor.getFlag('helveczia', 'student-skill'),
      student_skills_generated:
        this.actor.getFlag('helveczia', 'student-skill-generated-1') &&
        this.actor.getFlag('helveczia', 'student-skill-generated-2'),
      bonusSpellsChosen: this.actor.getFlag('helveczia', 'bonusSpellsChosen') as number,
      options: this.options,
      editable: this.isEditable,
      isToken: this.token && !this.token.data.actorLink,
      config: CONFIG.HV,
      user: game.user,
      classes: this.actor.data.data.classes,
      needToRoll:
        this.actor.data.data.hp.max === 0 ||
        (this.actor.getFlag('helveczia', 'rolled-hits-lvl') as number) < this.actor.data.data.level,
    };
    // Add actor, actor data and item
    data.actor = actorData.data;
    data.data = data.actor.data;
    data.items = this.actor.items.map((i) => i.data);
    data.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    data.effects = prepareActiveEffectCategories(this.actor.effects);
    data.maxspecialisms = this.actor.isVagabond()
      ? (actorData.data as CharacterActorData).data.level >= 5
        ? 3
        : 2
      : 1;
    data.spellslots = (this.actor as HVActor).getSpellSlots();
    data.spellBonus = (this.actor as HVActor).getSpellBonus();
    data.currentBonusSpells = [
      (this.actor.getFlag('helveczia', `bonusSpellsChosen-1`) as number) ?? 0,
      (this.actor.getFlag('helveczia', `bonusSpellsChosen-2`) as number) ?? 0,
      (this.actor.getFlag('helveczia', `bonusSpellsChosen-3`) as number) ?? 0,
    ];
    data.maxspells = data.spellslots.reduce((acc, n) => acc + n, 0);
    data.spellGroups = [1, 2, 3];
    data.worn = [];
    data.carried = [];
    data.mount = [];

    for (const category of Object.values(data.data.possessions)) {
      for (const item of category as HVItem[]) {
        switch ((item as HVItem).getFlag('helveczia', 'position')) {
          case 'worn':
            data.worn.push(item);
            break;
          case 'carried':
            data.carried.push(item);
            break;
          default:
            data.mount.push(item);
            break;
        }
      }
    }
    return data;
  }

  onDropAllow(_actor, data): boolean {
    // Prevent folders being dragged onto the sheet
    return data.type === 'Folder' ? false : true;
  }

  /** @override */
  _onSortItem(event, itemData): Promise<HVItem[]> | undefined {
    const source = this.actor.items.get(itemData._id);

    switch (source?.data.type) {
      case 'armour':
        this._sortPossession(event, source);
        return;
      case 'possession':
        this._sortPossession(event, source);
        return;
      case 'weapon':
        this._sortPossession(event, source);
        return;
      default:
        return super._onSortItem(event, itemData);
    }
  }

  /** @override */
  async _onDropItem(event: DragEvent, data: ActorSheet.DropData.Item): Promise<unknown> {
    log.debug('_onDropItem() | ', event, data);
    let shouldContinue = true;
    let item;
    let position = 'mount';
    try {
      const transfer = event.dataTransfer?.getData('text/plain') ?? '';
      data = JSON.parse(transfer);
      item = game.items?.get(data['id']);
    } catch (err) {
      return;
    }
    log.debug('_onDropItem() | dropped item :', item);
    switch (item?.type) {
      case 'people':
        shouldContinue = await this._removePeoples(item);
        log.debug('_onDropItem() | should continue?:', shouldContinue);
        break;
      case 'class':
        shouldContinue = await this._removeClasses(item);
        log.debug('_onDropItem() | should continue?:', shouldContinue);
        break;
      case 'skill':
        if (this.actor.items.getName(item.name)) {
          log.debug('_onDropItem() | already got this skill.');
          return;
        }
        if (this.actor.data.data.skills.length == this.actor.data.data.maxskills) {
          return ui.notifications.error(game.i18n.localize('HV.errors.fullSkills'));
        }
        if (item.data.data.subtype === 'magical' && !(this.actor.isCleric() && this.actor.isStudent())) {
          return ui.notifications.error(game.i18n.localize('HV.errors.notMagical'));
        }
        if (item.data.data.subtype === 'vagabond' && !this.actor.isVagabond()) {
          return ui.notifications.error(game.i18n.localize('HV.errors.notVagabond'));
        }
        if ((item.data.data.subtype === 'craft' || item.data.data.subtype === 'science') && this.actor.isVagabond()) {
          return ui.notifications.error(game.i18n.localize('HV.errors.areVagabond'));
        }
        break;
      case 'spell':
        if (item.data.data.class === 'cleric' && !this.actor.isCleric()) {
          return ui.notifications.error(game.i18n.localize('HV.errors.notCleric'));
        } else if (item.data.data.class === 'student' && !this.actor.isStudent()) {
          return ui.notifications.error(game.i18n.localize('HV.errors.notStudent'));
        }
        const level = parseInt(item.data.data.level);
        const spellSlots = this.actor.getSpellSlots();
        // console.log(`spellSlots: ${spellSlots[level-1]}, level:${level},spells.length:${this.actor.data.data.spells[level-1].length}`, this.actor.data.data.spells)
        if (this.actor.data.data.spells[level - 1].length >= spellSlots[level - 1]) {
          return ui.notifications.error(game.i18n.format('HV.errors.maxSpells', { level: level }));
        }
        break;
      case 'weapon':
      case 'armour':
      case 'possession':
        const capacitySlots = await this._calculateAvailableSlots();
        log.debug('_onDropItem() | carrying capacity:', capacitySlots);
        log.debug('_onDropItem() | item encumbrance:', item.data.data.encumbrance);
        if (capacitySlots.worn >= item.data.data.encumbrance) {
          position = 'worn';
        } else if (capacitySlots.carried >= item.data.data.encumbrance) {
          position = 'carried';
        }
        shouldContinue = capacitySlots.carried + capacitySlots.worn + capacitySlots.mount >= item.data.data.encumbrance;
        log.debug('_onDropItem() | should continue?:', shouldContinue);
        break;
    }
    if (shouldContinue) {
      const items = (await super._onDropItem(event, data)) as HVItem[];
      const item = items?.length ? items[0] : null;
      log.debug('_onDropItem() | created item:', item);
      if (item) {
        switch (item.type) {
          case 'weapon':
          case 'armour':
          case 'possession':
            item.setFlag('helveczia', 'position', position);
            log.debug(`_onDropItem() | set position of item to ${position}`);
            break;
          case 'spell':
            await item.createChatMessage(this.actor, 'HV.SpellRememorize');
            break;
        }
      }
    }
    return;
  }

  /**
   *
   * @returns availableSlots : number
   */
  async _calculateAvailableSlots(): Promise<any> {
    const sheetData = await this.getData();
    const capacity = this.actor.data.data.capacity - 8;
    const wornUsed = sheetData.worn.map((i) => i.data.data.encumbrance).reduce((acc, n) => acc + n, 0);
    const carriedUsed = sheetData.carried.map((i) => i.data.data.encumbrance).reduce((acc, n) => acc + n, 0);
    const mountUsed = sheetData.mount.map((i) => i.data.data.encumbrance).reduce((acc, n) => acc + n, 0);
    const worn = 8 - wornUsed;
    const carried = capacity - carriedUsed;
    const mount = 8 - mountUsed;
    log.debug(`_calculateAvailableSlots() | slots are worn:${worn}, carried: ${carried}, mount:${mount}`);
    return {
      worn: worn,
      carried: carried,
      mount: mount,
    };
  }

  /**
   *
   * @param event
   * @param source
   * @returns
   */
  async _sortPossession(event, source): Promise<undefined> {
    const positionTarget = event.target.closest('[data-column]');
    const columnID = positionTarget ? positionTarget.dataset.column : 'mount';
    const availableSlots = await this._calculateAvailableSlots();
    log.debug(`_onSortPossession() |encumbrance of item is ${source.data.data.encumbrance} `);
    const ok = availableSlots[columnID] - source.data.data.encumbrance >= 0;
    log.debug(`_onSortPossession() | ${ok} we have space, will place it at ${columnID} `);
    if (ok) source.setFlag('helveczia', 'position', columnID);
    return;
  }

  async _removePeoples(item): Promise<boolean> {
    if (item.name === this.actor.data.data.people) return false;
    const peoples = this.actor.items.filter((i) => i.type == 'people');
    await Utils.deleteEmbeddedArray(peoples, this.actor);
    return true;
  }

  async _removeClasses(item): Promise<boolean> {
    if (item.name === this.actor.data.data.class) return false;
    const itemData = item.data as ClassItemData;
    if (!itemData.data.specialism) {
      log.debug('_removeClasses() | Removing previous classes');
      const classes = this.actor.items.filter((i) => i.type == 'class');
      await Utils.deleteEmbeddedArray(classes, this.actor);
      return true;
    } else {
      const requiredProfession = itemData.data.parent.toLowerCase();
      const thisActorProfession = this.actor.data.data.class.toLowerCase();
      if (thisActorProfession === requiredProfession) {
        if (requiredProfession === 'fighter') {
          log.debug(`_removeClasses() | Removing specialisms for ${thisActorProfession} `);
          const classes = this.actor.items.filter(
            (i) =>
              i.type == 'class' &&
              (i.data as ClassItemData).data.specialism &&
              (i.data as ClassItemData).data.parent.toLowerCase() === this.actor.data.data.class.toLowerCase(),
          );
          await Utils.deleteEmbeddedArray(classes, this.actor);
        }
        return true;
      }
      ui.notifications.error(game.i18n.localize(`You must be a ${requiredProfession} for this specialism`));
      return false;
    }
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Item summaries
    html.find('.item .item-name').click((event) => this._onItemSummary(event));

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Roll Hit Points.
    html.find('.hitdie').click(this._onRollHitPoints.bind(this));

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Character generation to initialize
    html.find('.generate-abilities').click(this._generateAbilities.bind(this));
    html.find('.choose-race-class').click(this._generateRaceClass.bind(this));
    html.find('.choose-specialism').click(this._chooseSpecialism.bind(this));
    html.find('.generate-craft-skill').click(this._generateCraftSkill.bind(this));
    html.find('.generate-science-skills').click(this._generateScienceSkills.bind(this));
    html.find('.absolution').click(this._onAbsolution.bind(this));
    // lock sheet
    // html.find('#padlock').click(this._onToggleLock.bind(this));

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
        const spellLevel = (item.data as SpellItemData).data.level;
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
          ui.notifications.warn('you have already cast this spell and need to re-memorize it.');
          // item.setFlag('helveczia', 'castSpell', false);
        }
      }
    });

    // Rememorize spell
    html.find('.item-empty').click(async (ev) => {
      const li = $(ev.currentTarget).parents('.item-entry');
      const itemID = li.data('item-id');
      const item = this.actor.items.get(itemID);
      if (item) {
        await item.createChatMessage(this.actor, 'HV.SpellRememorize');
        if (item.getFlag('helveczia', 'bonusSpell') === true) {
          item.setFlag('helveczia', 'castSpell', false);
        }
      }
    });

    // Active Effect management
    html.find('.effect-control').click((ev) => onManageActiveEffect(ev, this.actor));
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
        const data = t.actor?.data;
        if (data?._id) {
          target = {
            id: data._id,
          };
        }
        if (target?.id) break;
      }
    }
    const rollData = await this.actor.getRollMods(dataset);
    this.actor.rollCheck(rollData, target);
  }

  async _onRollHitPoints(event) {
    event.preventDefault();
    const hitpoints = await HVCharacterCreator.rollHitPoints(this.actor.data);
    const success = this.actor.data.data.hp.max < hitpoints.max;
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
      await this.actor.update({ data: updateData });
      this.render(true);
    }
    this.actor.setFlag('helveczia', 'rolled-hits-lvl', this.actor.data.data.level);
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
    const description = TextEditor.enrichHTML(item.data.data.description);
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
        title: `${game.i18n.localize('Choose Origin and Class')}`,
        content: content,
        default: 'submit',
        buttons: {
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize('HV.Cancel'),
            callback: () => null,
          },
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
        title: `${game.i18n.localize('Choose Specialism')}`,
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

  async getRandomCraft(existingSkills: string[]): Promise<StoredDocument<HVItem> | null> {
    const craftPack = game.packs.find((p) => p.metadata.name === 'craft-skills');
    return this.getRandomSkill(craftPack, existingSkills);
  }

  async getRandomScience(existingSkills: string[]): Promise<StoredDocument<HVItem> | null> {
    const sciencePack = game.packs.find((p) => p.metadata.name === 'science-skills');
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
    const existingSkills = (this.actor.data as CharacterActorData).data.skills.map((i) => i.name);
    const rndCraft = await this.getRandomCraft(existingSkills);
    if (rndCraft) {
      const craft = { name: rndCraft?.name, ability: (rndCraft.data as SkillItemData).data.ability };
      const description =
        'Due to their diligence, they learn an extra, randomly rolled Craft skill with a +2 bonus. In this trade, they are already considered journeymen by guild standards, and enjoy all attendant benefits.  Germans can become masters in their craft  at 4th level.';
      const skill = {
        name: craft.name,
        type: 'skill',
        data: {
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
    const existingSkills = (this.actor.data as CharacterActorData).data.skills.map((i) => i.name);
    existingSkills.push(await this._genRndScienceSkill(1, existingSkills));
    await this._genRndScienceSkill(2, existingSkills);
    await this.actor.update();
  }

  async _genRndScienceSkill(idx, existingSkills): Promise<string | null> {
    const rndSkill = await this.getRandomScience(existingSkills);
    if (rndSkill != null) {
      const skillData = { name: rndSkill.name, ability: (rndSkill.data as SkillItemData).data.ability };
      const description = 'Random science known from their Student studies.';
      const skill = {
        name: skillData.name,
        type: 'skill',
        data: {
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
    return CONFIG.HV.itemClasses[item.data.type] ? CONFIG.HV.itemClasses[item.data.type].getTags(item, this.actor) : '';
  }

  async _onAbsolution(event) {
    event.preventDefault();
    const sins: HVItem[] = this.actor.data.data.deeds.filter((d) => d.data.data.subtype === 'sin');
    const virtues = this.actor.data.data.deeds.filter(
      (d) => d.data.data.subtype === 'virtue' && d.data.data.magnitude > 1,
    );
    const lowVirtue = this.actor.data.data.virtue < 7;

    if (lowVirtue && virtues.length == 0) {
      ui.notifications.warn(
        game.i18n.localize(
          'In such a low state of virtue, you must have at least a moderately good deed for absolution!',
        ),
      );
      return;
    }

    const italian = this.actor.isItalian() ? 1 : 0;
    const roll = await new Roll('1d3 + 1 + @italian', { italian: italian }).evaluate({ async: true });

    const absolved: HVItem[] = [];
    let absolvedTotal = 0;

    while (sins.length > 0) {
      const sin = sins.shift();
      if (sin) {
        const mag: number = Math.floor((sin?.data as DeedItemData).data.magnitude);
        if (absolvedTotal + mag < roll.total) {
          absolvedTotal = absolvedTotal + mag;
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
}
