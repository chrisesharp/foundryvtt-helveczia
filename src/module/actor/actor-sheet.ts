import { HVCharacterCreator } from '../apps/chargen';
import { onManageActiveEffect, prepareActiveEffectCategories } from '../effects';
import { ClassItem } from '../items/class/class-item';
import { PeopleItem } from '../items/people/people-item';

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
    // html.find('.item .item-name').click((event) => this._onItemSummary(event));

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Character generation to initialize
    html.find('.generate-abilities').click(this._generateAbilities.bind(this));
    html.find('.choose-race-class').click(this._generateRaceClass.bind(this));
    // lock sheet
    // html.find('#padlock').click(this._onToggleLock.bind(this));

    // Random Mannerism
    // html.find('#manner-roll').click(this._onGenerate.bind(this));

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Add Inventory Item
    // html.find('.item-rnd').click(this._onRandomPossession.bind(this));

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
  _onRoll(event) {
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
            // armour: data.data.armour.value,
          };
          // target.potency = data.data.resistance.potency;
          // target.hitresolution = data.data.hitresolution;
          // target.consequences = data.data.consequences;
        }
        if (target?.id) break;
      }
    }

    switch (dataset.roll) {
      case 'attr':
        dataset.resource = 'scores';
        break;
      case 'save':
        dataset.resource = 'saves';
        break;
      default:
    }
    this.actor.rollCheck(dataset, target);
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

    // if (item.type === "consequence") {
    // const resource = game.i18n.localize(`DEE.resource.${item.data.data.resource}.long`);
    // options += `<label>${resource} </label>`;
    // options += `<i class="fas fa-caret-down" style="font-size: small;text-align: right;"></i>${Math.abs(item.data.data.potency)}`;
    // }

    // if (["association","focus","occupation"].includes(item.type)) {
    //     item.data.data.abilities.forEach((i)=> {
    //         const ability = abilities.filter(e => e.name===i.name);
    //         const checked = (ability.length > 0) ? check : empty;
    //         options += `${checked}&nbsp;<label style="font-size: 0.9em;" for="${i.id}" >${i.name}</label>&nbsp;`;
    //     });
    // }
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
}
