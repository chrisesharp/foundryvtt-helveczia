import { NPCGenerator } from '../npcgen';
import { prepareActiveEffectCategories } from '../../effects';
import { HVItem } from '../../documents/item';
import { Logger } from '../../logger';
import { HVPDF } from '../pdf';
import { HVActorSheet } from './actor-sheet';
const { TextEditor } = foundry.applications.ux;

const log = new Logger();

export class HVNPCSheet extends HVActorSheet {
  static [key: string]: any;
  static readonly DEFAULT_OPTIONS: Record<string, any> = {
    classes: ['helveczia', 'sheet', 'actor', 'npc'],
    window: {
      controls: [HVPDF.getPDFButton(), NPCGenerator.getButton()],
    },
  };

  /** @override */
  static readonly PARTS = {
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

  // eslint-disable-next-line prettier/prettier
  async _prepareContext(options) { // NOSONAR typescript:S7503 -- required async override of ApplicationV2 base class lifecycle method
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
    data.items = this.actor.items.map((i) => i);
    data.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    data.possessions = data.data.possessions;
    data.effects = prepareActiveEffectCategories(this.actor.allApplicableEffects());
    data.spellGroups = [1, 2, 3];
    return data;
  }

  /** @override */
  protected _getDefaultTab(): string {
    return 'combat';
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
  _calculateAvailableSlots(): { worn: number; carried: number; mount: number } {
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
  async _onDropItem(event: DragEvent, item: Item): Promise<unknown> {
    log.debug('_onDropItem() | ', event, item);
    let shouldContinue = true;
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
      const items = (await super._onDropItem(event, item)) as HVItem[];
      const createdItem = items?.length ? items[0] : null;
      log.debug('_onDropItem() | created item:', createdItem);
      if (createdItem) {
        switch (createdItem.type) {
          case 'weapon':
          case 'armour':
          case 'book':
          case 'possession':
            await createdItem.setFlag('helveczia', 'position', 'worn');
            log.debug(`_onDropItem() | set position of item to worn`);
            break;
        }
      }
      return items;
    }
  }
}
