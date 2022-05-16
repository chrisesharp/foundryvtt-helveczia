import { HVCharacterCreator } from '../apps/chargen';
import { onManageActiveEffect, prepareActiveEffectCategories } from '../effects';
import { ClassItem } from '../items/class/class-item';
import { PeopleItem } from '../items/people/people-item';
import { SkillItemData } from '../items/item-types';
import { Logger } from '../logger';
import { HVItem } from '../items/item';

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
      vagabond_skill: this.actor.getFlag('helveczia', 'vagabond-skill'),
      fighter_third_skill: this.actor.getFlag('helveczia', 'fighter-third-skill'),
      fighter_fifth_skill: this.actor.getFlag('helveczia', 'fighter-fifth-skill'),
      options: this.options,
      editable: this.isEditable,
      isToken: this.token && !this.token.data.actorLink,
      config: CONFIG.HV,
      user: game.user,
    };
    // Add actor, actor data and item
    data.actor = actorData.data;
    data.data = data.actor.data;
    data.items = this.actor.items.map((i) => i.data);
    data.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    data.effects = prepareActiveEffectCategories(this.actor.effects);
    return data;
  }

  /** @override */
  async _onDrop(event) {
    let item;
    try {
      const data = JSON.parse(event.dataTransfer.getData('text/plain'));
      item = game.items?.get(data.id);
    } catch (err) {
      return false;
    }
    if (item) {
      switch (item.type) {
        case 'people':
          this._removePeoples();
          break;
        case 'class':
          this._removeClasses();
          break;
      }
    }
    return super._onDrop(event);
  }

  async _removePeoples(): Promise<void> {
    const peoples = this.actor.items.filter((i) => i.type == 'people');
    await Promise.all(
      peoples.map((p) => {
        if (p.id) return this.actor.deleteEmbeddedDocuments('Item', [p.id]);
        return Promise.resolve();
      }),
    );
  }

  async _removeClasses(): Promise<void> {
    const classes = this.actor.items.filter((i) => i.type == 'class');
    await Promise.all(
      classes.map((p) => {
        if (p.id) return this.actor.deleteEmbeddedDocuments('Item', [p.id]);
        return Promise.resolve();
      }),
    );
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Item summaries
    html.find('.item .item-name').click((event) => this._onItemSummary(event));

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Character generation to initialize
    html.find('.generate-abilities').click(this._generateAbilities.bind(this));
    html.find('.choose-race-class').click(this._generateRaceClass.bind(this));
    html.find('.generate-craft-skill').click(this._generateCraftSkill.bind(this));
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
    html.find('.item-roll-mod').each(this._getItemRollMod.bind(this));

    // Active Effect management
    html.find('.effect-control').click((ev) => onManageActiveEffect(ev, this.actor));
  }

  async _getItemRollMod(_idx, div) {
    const itemDiv = $(div).parent().children('.rollable');
    const itemID = itemDiv.data('item-id');
    const item = this.actor.items.get(itemID);
    let mods = '0';
    if (item) {
      const itemData = item.data as SkillItemData;
      const data = await this.getRollMods({ attr: itemData.data.ability, roll: itemData.type, itemId: item.id });
      const value = data.mods.reduce((acc, n) => acc + n, 0);
      mods = value > 0 ? `+${value}` : `${value}`;
    }
    $(div).text(mods);
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
          const fate = await PeopleItem.enableHungarianFate(this.actor);
          if (data.attr === fate.attr) mod.push(fate.mod);
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
    if (resource !== '') {
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
        const ability = this.actor.data.data.scores[skill.data.ability].mod;
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
  _onItemSummary(event) {
    // const empty = `<span class="fa-stack" style="font-size: 0.5em;">
    //                 <i class="far fa-square fa-stack-2x" style="vertical-align:middle;"></i>
    //             </span>`;
    // const check = `<span class="fa-stack" style="font-size: 0.5em;">
    //                 <i class="fas fa-square fa-stack-2x" style="vertical-align:middle;"></i>
    //                 <i class="fas fa-check fa-stack-1x fa-inverse" style="vertical-align:middle;"></i>
    //             </span>`;
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
      const div = $(
        `<div class="item-summary">
            <div>
                ${description}
            </div>
            ${options}
        </div>`,
      );
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

  async getRandomCraft(): Promise<StoredDocument<HVItem> | null> {
    const craftPack = game.packs.find((p) => p.metadata.name === 'craft-skills');
    if (craftPack) {
      const craftNames = (await craftPack.getIndex()).map((e) => e._id);
      const craftId = craftNames[Math.floor(Math.random() * craftNames.length)];
      if (craftId) {
        const craft = await craftPack.getDocument(craftId);
        return craft ? (craft as StoredDocument<HVItem>) : null;
      }
    }
    return null;
  }

  async _generateCraftSkill(event) {
    event.preventDefault();
    const rndCraft = await this.getRandomCraft();
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
}
