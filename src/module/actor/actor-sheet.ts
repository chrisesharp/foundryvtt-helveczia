import { HVCharacterCreator } from '../apps/chargen';
import { onManageActiveEffect, prepareActiveEffectCategories } from '../effects';
import { ClassItem } from '../items/class/class-item';
import { PeopleItem } from '../items/people/people-item';
import { ClassItemData, SkillItemData } from '../items/item-types';
import { Logger } from '../logger';
import { HVItem } from '../items/item';
import { CharacterActorData } from './actor-types';

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
      fighter_specialism: this.actor.getFlag('helveczia', 'fighter-specialism'),
      fighter_third_skill: this.actor.getFlag('helveczia', 'fighter-third-skill'),
      fighter_fifth_skill: this.actor.getFlag('helveczia', 'fighter-fifth-skill'),
      student_skill: this.actor.getFlag('helveczia', 'student-skill'),
      student_skills_generated:
        this.actor.getFlag('helveczia', 'student-skill-generated-1') &&
        this.actor.getFlag('helveczia', 'student-skill-generated-2'),
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
    if (this.actor.isVagabond()) {
      data.maxspecialisms = (actorData.data as CharacterActorData).data.level >= 5 ? 3 : 2;
    } else {
      data.maxspecialisms = 1;
    }
    return data;
  }

  /** @override */
  async _onDrop(event) {
    let item;
    let data;
    const actor = this.actor;
    const allowed = Hooks.call('dropActorSheetData', actor, this, data);
    if (allowed === false) return;
    let shouldContinue = true;
    try {
      data = JSON.parse(event.dataTransfer.getData('text/plain'));
      item = game.items?.get(data.id);
    } catch (err) {
      return;
    }

    if (item) {
      switch (item.type) {
        case 'people':
          shouldContinue = await this._removePeoples(item);
          break;
        case 'class':
          shouldContinue = await this._removeClasses(item);
          break;
        case 'skill':
          if (this.actor.items.getName(item.name)) return;
          if (this.actor.data.data.skills.length == this.actor.data.data.maxskills) {
            return ui.notifications.error(game.i18n.localize('HV.errors.fullSkills'));
          }
          if (item.data.data.subtype === 'esoteric' && !(this.actor.isCleric() || this.actor.isStudent())) {
            return ui.notifications.error(game.i18n.localize('HV.errors.notEsoteric'));
          }
          if (item.data.data.subtype === 'vagabond' && !this.actor.isVagabond()) {
            return ui.notifications.error(game.i18n.localize('HV.errors.notVagabond'));
          }
          break;
      }
    }
    if (shouldContinue) {
      switch (data.type) {
        case 'ActiveEffect':
          return this._onDropActiveEffect(event, data);
        case 'Actor':
          return this._onDropActor(event, data);
        case 'Item':
          return this._onDropItem(event, data);
        // case "Folder":
        // if (data.documentName === 'Item')
        // return this._onDropFolder(event, data);
      }
    }
  }

  async _removePeoples(item): Promise<boolean> {
    if (item.name === this.actor.data.data.people) return false;
    const peoples = this.actor.items.filter((i) => i.type == 'people');
    await Promise.all(
      peoples.map((p) => {
        if (p.id) return this.actor.deleteEmbeddedDocuments('Item', [p.id]);
        return Promise.resolve();
      }),
    );
    return true;
  }

  async _removeClasses(item): Promise<boolean> {
    if (item.name === this.actor.data.data.class) return false;
    const itemData = item.data as ClassItemData;
    if (!itemData.data.specialism) {
      log.debug('_removeClasses() | Removing previous classes');
      const classes = this.actor.items.filter((i) => i.type == 'class');
      await Promise.all(
        classes.map((p) => {
          if (p.id) return this.actor.deleteEmbeddedDocuments('Item', [p.id]);
          return Promise.resolve();
        }),
      );
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
          await Promise.all(
            classes.map((p) => {
              if (p.id) return this.actor.deleteEmbeddedDocuments('Item', [p.id]);
              return Promise.resolve();
            }),
          );
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

    // Update Item Roll Mods
    // html.find('.item-roll-mod').each(this._getItemRollMod.bind(this));

    // Active Effect management
    html.find('.effect-control').click((ev) => onManageActiveEffect(ev, this.actor));
  }

  async _getItemRollMod(itemID: string): Promise<string> {
    const item = this.actor.items.get(itemID);
    let mods = '0';
    if (item) {
      const itemData = item.data as SkillItemData;
      const data = await this.getRollMods({ attr: itemData.data.ability, roll: itemData.type, itemId: item.id });
      const value = data.mods.reduce((acc, n) => acc + n, 0);
      mods = value > 0 ? `+${value}` : `${value}`;
    }
    return mods;
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
        if (data?.type === 'npc' && data._id) {
          target = {
            id: data._id,
          };
        }
        if (target?.id) break;
      }
    }

    const rollData = await this.getRollMods(dataset);
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

  async getRollMods(data): Promise<{ mods: number[]; longName: string }> {
    let longName = '';
    const mod: number[] = [];
    switch (data.roll) {
      case 'attr':
        data.resource = 'scores';
        break;
      case 'save':
        data.resource = 'saves';
        if (this.actor.isHungarian()) {
          const fated = await PeopleItem.enableHungarianFate(this.actor);
          if (data.attr === fated.attr) mod.push(fated.mod);
        }
        break;
      case 'skill':
        data.resource = '';
        mod.push(this.actor.data.data.level);
        break;
      default:
    }
    const attribute = data.attr;
    const resource = data.resource;
    if (resource !== '' && attribute) {
      mod.push(this.actor.data.data[resource][attribute].mod);
      longName = game.i18n.format(`HV.${resource}.${attribute}.long`);
      log.debug(
        `getRollMods() | name:${longName} - resource=${resource}, attribute=${attribute}, mod=${mod.join('+')}`,
      );
    } else {
      const item = this.actor.items.get(`${data.itemId}`);
      log.debug(`getRollMods() | itemId:${data.itemId}`);
      if (item) {
        const skill = item.data as SkillItemData;
        const bonus = skill.data.bonus;
        const ability = this.actor.data.data.scores[skill.data.ability]?.mod;
        mod.push(bonus);
        mod.push(ability);
        longName = item.name ?? game.i18n.localize('HV.skill');
        log.debug(`getRollMods() | name:${longName} - ability=${skill.data.ability}, bonus=${bonus}`);
      } else {
        log.error('getRollMods() | itemId not found on actor');
      }
    }
    return { mods: mod, longName: longName };
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
    // const abilities = this.actor.getAbilities();
    const options = '';

    // Toggle summary
    if (li.hasClass('expanded')) {
      const summary = li.children('.item-summary');
      summary.slideUp(200, () => summary.remove());
    } else {
      // Add item tags
      let tags = `
      <div class="item-summary">`;
      if (item.type === 'skill')
        tags += `
      <ol class="tag-list">
        <li class="tag">${game.i18n.localize(`HV.scores.${(item.data as SkillItemData).data.ability}.short`)}</li>
        <li class="tag">${await this._getItemRollMod(item.id ?? '')}</li>
      </ol>`;
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
}
