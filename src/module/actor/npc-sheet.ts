import { NPCGenerator } from '../apps/npcgen';
import { prepareActiveEffectCategories } from '../effects';
import { HVItem } from '../items/item';
import { Logger } from '../logger';
import { HVPDF } from '../pdf';
import { HVActorSheet } from './actor-sheet';
const { TextEditor } = foundry.applications.ux;

const log = new Logger();

export class HVNPCSheet extends HVActorSheet {
  static DEFAULT_OPTIONS = {
    classes: ['helveczia', 'sheet', 'actor', 'npc'],
    position: {
      width: 580,
      height: 730,
    },
    actions: {
      onEditImage: this._onEditImage,
    },
    window: {
      resizable: true,
      controls: [HVPDF.getPDFButton(), NPCGenerator.getButton()],
    },
    // Custom property that's merged into `this.options`
    dragDrop: [{ dragSelector: '[data-drag]', dropSelector: null }],
    form: {
      submitOnChange: true,
    },
  };

  /** @override */
  static PARTS = {
    header: {
      template: 'systems/helveczia/templates/actor/partials/npc-header.hbs',
    },
    tabs: {
      template: 'systems/helveczia/templates/actor/partials/npc-nav.hbs',
    },
    abilities: {
      template: 'systems/helveczia/templates/actor/partials/actor-abilities.hbs',
    },
    skills: {
      template: 'systems/helveczia/templates/actor/partials/npc-skills.hbs',
    },
    possessions: {
      template: 'systems/helveczia/templates/actor/partials/npc-equipment.hbs',
    },
    combat: {
      template: 'systems/helveczia/templates/actor/partials/actor-combat.hbs',
    },
    effects: {
      template: 'systems/helveczia/templates/actor/partials/actor-effects.hbs',
    },
    notes: {
      template: 'systems/helveczia/templates/actor/partials/actor-notes.hbs',
    },
    fighter: {
      template: 'systems/helveczia/templates/actor/partials/fighter.hbs',
    },
    cleric: {
      template: 'systems/helveczia/templates/actor/partials/cleric.hbs',
    },
    vagabond: {
      template: 'systems/helveczia/templates/actor/partials/vagabond.hbs',
    },
    student: {
      template: 'systems/helveczia/templates/actor/partials/student.hbs',
    },
  };

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    // Not all parts always render
    options.parts = ['header', 'tabs'];
    // Don't show the other tabs if only limited view
    if (this.document.limited) {
      options.parts.push('notes');
      return;
    }
    options.parts.push('abilities', 'skills', 'combat', 'possessions', 'notes');
    if (game.settings?.get('helveczia', 'effects') && game.user.isGM) {
      options.parts.push('effects');
    }
    if (this.actor.isCleric()) {
      options.parts.push('cleric');
    }
    if (this.actor.isFighter()) {
      options.parts.push('fighter');
    }
    if (this.actor.isVagabond()) {
      options.parts.push('vagabond');
    }
    if (this.actor.isStudent()) {
      options.parts.push('student');
    }
  }

  async _prepareContext(options) {
    const data: any = {
      owner: this.actor.isOwner,
      fighter_class: this.actor.getFlag('helveczia', 'fighter-class'),
      vagabond_class: this.actor.getFlag('helveczia', 'vagabond-class'),
      cleric_class: this.actor.isCleric(),
      fighter_specialism: this.actor.getFlag('helveczia', 'fighter-specialism'),
      student_class: this.actor.getFlag('helveczia', 'student-class'),
      sex: this.actor.getFlag('helveczia', 'sex') ?? 'male',
      options: this.options,
      editable: this.isEditable,
      isToken: this.prototypeToken && !this.prototypeToken.actorLink,
      config: CONFIG.HV,
      user: game.user,
      classes: this.actor.system.classes,
      fields: this.document.schema.fields,
    };
    data.tabs = this._getTabs(options.parts);
    // Add actor, actor data and item
    data.actor = this.actor;
    data.data = data.actor.system;
    data.items = this.actor.items.map((i) => i.system);
    data.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    data.possessions = data.data.possessions;
    data.effects = prepareActiveEffectCategories(this.actor.allApplicableEffects());
    data.spellGroups = [1, 2, 3];
    return data;
  }

  /**
   * Generates the data for the generic tab navigation template
   * @param {string[]} parts An array of named template parts to render
   * @returns {Record<string, Partial<ApplicationTab>>}
   * @protected
   */
  _getTabs(parts) {
    // If you have sub-tabs this is necessary to change
    const tabGroup = 'primary';
    // Default tab for first time it's rendered this session
    if (!this.tabGroups[tabGroup]) this.tabGroups[tabGroup] = 'combat';
    return parts.reduce((tabs, partId) => {
      const tab = {
        cssClass: '',
        group: tabGroup,
        // Matches tab property to
        id: '',
        // FontAwesome Icon, if you so choose
        icon: '',
        // Run through localization
        label: 'HV.tabs.',
      };
      switch (partId) {
        case 'header':
        case 'tabs':
          return tabs;
        default:
          tab.id = partId;
          tab.label += partId;
          break;
      }
      if (this.tabGroups[tabGroup] === tab.id) tab.cssClass = 'active';
      tabs[partId] = tab;
      return tabs;
    }, {});
  }

  /** @override */
  async _preparePartContext(partId, context) {
    switch (partId) {
      case 'notes':
        context.tab = context.tabs[partId];
        context.enrichedDescription = await TextEditor.enrichHTML(this.actor.system.description, {
          secrets: this.document.isOwner,
          rollData: this.actor.getRollData(),
          // Relative UUID resolution
          relativeTo: this.actor,
        });
        break;
      case 'effects':
        context.tab = context.tabs[partId];
        context.effects = prepareActiveEffectCategories(this.actor.allApplicableEffects());
        break;
      default:
        context.tab = context.tabs[partId];
        break;
    }
    return context;
  }

  /** @override */
  async _calculateAvailableSlots(): Promise<any> {
    const worn = 24;
    const carried = 0;
    const mount = 0;
    log.debug(`NPC._calculateAvailableSlots() | slots are worn:${worn}, carried: ${carried}, mount:${mount}`);
    return {
      worn: worn,
      carried: carried,
      mount: mount,
    };
  }

  /** @override */
  async _onDropItem(event: DragEvent, data: ActorSheet.DropData.Item): Promise<unknown> {
    log.debug('_onDropItem() | ', event, data);
    let shouldContinue = true;
    const item = await Item.implementation.fromDropData(data);
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
          case 'book':
          case 'possession':
            item.setFlag('helveczia', 'position', 'worn');
            log.debug(`_onDropItem() | set position of item to worn`);
            break;
        }
      }
      return items;
    }
    return;
  }

  static async _onEditImage(_event, target) {
    const attr = target.dataset.edit;
    const current = foundry.utils.getProperty(this.document, attr);
    const { img } = this.document.constructor.getDefaultArtwork?.(this.document.toObject()) ?? {};
    const fp = new FilePicker({
      current,
      type: 'image',
      redirectToRoot: img ? [img] : [],
      callback: (path) => {
        this.document.update({ [attr]: path });
      },
      top: this.position.top + 40,
      left: this.position.left + 10,
    });
    return fp.browse();
  }
}
