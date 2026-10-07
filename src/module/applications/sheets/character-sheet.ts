import { prepareActiveEffectCategories } from '../../effects';
import { HVItem } from '../../documents/item';
import { Logger } from '../../logger';
import { HVActor } from '../../documents/actor';
import { HVActorSheet } from './actor-sheet';
import { CharacterActorData } from '../../types/actor-types';
import { HVPDF } from '../pdf';
import { ContainerItem } from '../../documents/container-item';
const { TextEditor } = foundry.applications.ux;

const log = new Logger();

export class HVCharacterSheet extends HVActorSheet {
  static [key: string]: any;
  static readonly DEFAULT_OPTIONS: Record<string, any> = {
    classes: ['helveczia', 'sheet', 'actor', 'character'],
    window: {
      controls: [HVPDF.getPDFButton()],
    },
  };

  /** @override */
  static readonly PARTS = {
    header: {
      template: 'systems/helveczia/templates/actor/partials/character-header.hbs',
    },
    tabs: {
      template: 'systems/helveczia/templates/actor/partials/character-nav.hbs',
    },
    abilities: {
      template: 'systems/helveczia/templates/actor/partials/actor-abilities.hbs',
    },
    skills: {
      template: 'systems/helveczia/templates/actor/partials/actor-skills.hbs',
    },
    combat: {
      template: 'systems/helveczia/templates/actor/partials/actor-combat.hbs',
    },
    possessions: {
      template: 'systems/helveczia/templates/actor/partials/actor-equipment.hbs',
    },
    deeds: {
      template: 'systems/helveczia/templates/actor/partials/actor-deeds.hbs',
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
    options.parts.push('abilities', 'skills', 'combat', 'possessions', 'deeds', 'notes');
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

  /** @override */
  // eslint-disable-next-line prettier/prettier
  async _prepareContext(options) { // NOSONAR typescript:S7503 -- required async override of ApplicationV2 base class lifecycle method
    const data: any = {
      owner: this.actor.isOwner,
      sex: this.actor.getFlag('helveczia', 'sex') ?? 'male',
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
      cleric_doctorate: this.actor.getFlag('helveczia', 'cleric-doctorate'),
      fighter_specialism: this.actor.getFlag('helveczia', 'fighter-specialism'),
      fighter_third_skill: this.actor.getFlag('helveczia', 'fighter-third-skill'),
      fighter_fifth_skill: this.actor.getFlag('helveczia', 'fighter-fifth-skill'),
      student_class: this.actor.getFlag('helveczia', 'student-class'),
      student_skills_generated:
        this.actor.getFlag('helveczia', 'student-skill-generated-1') &&
        this.actor.getFlag('helveczia', 'student-skill-generated-2'),
      student_doctorate: this.actor.getFlag('helveczia', 'student-doctorate'),
      student_dr_spells: this.actor.getFlag('helveczia', 'student-dr-spells'),
      bonusSpellsChosen: this.actor.getFlag('helveczia', 'bonusSpellsChosen') as number,
      options: this.options,
      editable: this.isEditable,
      isToken: this.prototypeToken && !this.prototypeToken.actorLink,
      config: CONFIG.HV,
      user: game.user,
      classes: this.actor.system.classes,
      needToRoll:
        this.actor.system.hp.max === 0 ||
        (this.actor.getFlag('helveczia', 'rolled-hits-lvl') as number) < this.actor.system.level,
      // Necessary for formInput and formFields helpers
      fields: this.document.schema.fields,
    };
    data.tabs = this._getTabs(options.parts);
    // Add actor, actor data and item
    data.actor = this.actor;
    data.data = this.actor.system;
    data.items = this.actor.items.map((i) => i);
    data.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    data.hasBible = data.items.some((i) => i.name.includes('Bible') || i.name.includes('Szentírás'));
    data.effects = prepareActiveEffectCategories(this.actor.allApplicableEffects());
    const vagabondSpecialisms = (this.actor.system as CharacterActorData['system']).level >= 5 ? 3 : 2;
    data.maxspecialisms = this.actor.isVagabond() ? vagabondSpecialisms : 1;
    data.spellslots = (this.actor as HVActor).getSpellSlots();
    data.spellBonus = (this.actor as HVActor).getSpellBonus();
    data.currentBonusSpells = [
      (this.actor.getFlag('helveczia', `bonusSpellsChosen-1`) as number) ?? 0,
      (this.actor.getFlag('helveczia', `bonusSpellsChosen-2`) as number) ?? 0,
      (this.actor.getFlag('helveczia', `bonusSpellsChosen-3`) as number) ?? 0,
    ];
    data.maxspells = data.spellslots.reduce((acc, n) => acc + n, 0);
    data.spellGroups = [1, 2, 3];
    const slots = this.categorisePossessions(data.data.possessions);
    data.worn = slots.worn;
    data.carried = slots.carried;
    data.mount = slots.mount;
    return data;
  }

  categorisePossessions(possessions): { worn: Item[]; carried: Item[]; mount: Item[] } {
    const worn: Item[] = [];
    const carried: Item[] = [];
    const mount: Item[] = [];

    for (const category of Object.values(possessions)) {
      for (const item of category as HVItem[]) {
        const container = item.getFlag('helveczia', 'in-container');
        if (!container) {
          switch (item.getFlag('helveczia', 'position')) {
            case 'worn':
              worn.push(item);
              break;
            case 'carried':
              carried.push(item);
              break;
            default:
              mount.push(item);
              break;
          }
        }
      }
    }

    return { worn: worn, carried: carried, mount: mount };
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
      case 'possessions':
        context.tab = context.tabs[partId];
        context.availableSlots = this._calculateAvailableSlots();
        context.usedSlots = context.data.capacity - context.availableSlots['worn'] - context.availableSlots['carried'];
        context.isEncumbered = context.usedSlots > context.data.capacity;
        await this.actor.setFlag('helveczia', 'encumbered', context.isEncumbered);
        break;
      case 'deeds':
        context.tab = context.tabs[partId];
        context.allowPlayerEdit = CONFIG.HV.allowPlayerDeedEdit || game.user?.isGM;
        break;
      default:
        context.tab = context.tabs[partId];
        break;
    }
    return context;
  }

  /**
   *
   * @returns availableSlots : number
   */
  _calculateAvailableSlots(): { worn: number; carried: number; mount: number } {
    const sheetData = this.categorisePossessions(this.actor.system?.possessions);
    const capacity = this.actor.system.capacity - 8;
    const wornUsed = sheetData.worn.map((i) => Number.parseInt(i.system.encumbrance)).reduce((acc, n) => acc + n, 0);
    const carriedUsed = sheetData.carried
      .map((i) => Number.parseInt(i.system.encumbrance))
      .reduce((acc, n) => acc + n, 0);
    const mountUsed = sheetData.mount.map((i) => Number.parseInt(i.system.encumbrance)).reduce((acc, n) => acc + n, 0);
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

  /** @override */
  async _onDropItem(event: DragEvent, item: Item): Promise<unknown> {
    log.debug('_onDropItem() | ', event, item);
    const result = await this._determineDroppedType(item);
    if (result.shouldContinue) {
      const items = (await super._onDropItem(event, item)) as HVItem[];
      const createdItem = items?.length ? items[0] : null;
      log.debug('_onDropItem() | created item:', createdItem);
      if (createdItem) {
        switch (createdItem.type) {
          case 'weapon':
          case 'armour':
          case 'book':
          case 'possession':
          case 'container':
            await createdItem.setFlag('helveczia', 'position', result.position);
            await createdItem.unsetFlag('helveczia', 'in-container');
            log.debug(`_onDropItem() | set position of item to ${result.position}`);
            break;
          case 'spell':
            await createdItem.createChatMessage(this.actor, 'HV.SpellMemorize');
            break;
          case 'class':
            this.tabGroups['primary'] = this._getDefaultTab();
            await this.render();
            break;
        }
      }
      return items;
    }
  }

  async _determineDroppedType(item: Item): Promise<{ position: string; shouldContinue: boolean }> {
    const result = {
      position: 'mount',
      shouldContinue: true,
    };
    switch (item?.type) {
      case 'people':
        result.shouldContinue = await this._removePeoples(item);
        break;
      case 'class':
        result.shouldContinue = await this._removeClasses(item);
        break;
      case 'skill':
        result.shouldContinue = await this._determineDroppedSkill(item);
        break;
      case 'spell':
        result.shouldContinue = await this._determineDroppedSpell(item);
        break;
      case 'weapon':
      case 'armour':
      case 'book':
      case 'possession': {
        const capacitySlots = this._calculateAvailableSlots();
        log.debug('_onDropItem() | carrying capacity:', capacitySlots);
        log.debug('_onDropItem() | item encumbrance:', item.system.encumbrance);
        if (capacitySlots.worn >= item.system.encumbrance) {
          result.position = 'worn';
        } else {
          result.position = 'carried';
        }
        break;
      }
    }
    log.debug('_onDetermineDroppedType() | should continue?:', result.shouldContinue);
    return result;
  }

  async _determineDroppedSkill(item: Item): Promise<boolean> {
    if (this.actor.items.getName(item.name)) {
      log.debug('_onDropItem() | already got this skill.');
      return false;
    }
    if (this.actor.system.skills.length == this.actor.system.maxskills) {
      await ui.notifications.error(game.i18n.localize('HV.errors.fullSkills'));
      return false;
    }
    if (item.system.subtype === 'magical' && !(this.actor.isCleric() || this.actor.isStudent())) {
      await ui.notifications.error(game.i18n.localize('HV.errors.notMagical'));
      return false;
    }
    if (item.system.subtype === 'vagabond' && !this.actor.isVagabond()) {
      await ui.notifications.error(game.i18n.localize('HV.errors.notVagabond'));
      return false;
    }
    if ((item.system.subtype === 'craft' || item.system.subtype === 'science') && this.actor.isVagabond()) {
      await ui.notifications.error(game.i18n.localize('HV.errors.areVagabond'));
      return false;
    }
    return true;
  }

  async _determineDroppedSpell(item: Item): Promise<boolean> {
    if (item.system.class === 'cleric') {
      if (!this.actor.isCleric()) {
        await ui.notifications.error(game.i18n.localize('HV.errors.notCleric'));
        return false;
      }
      if (this.actor.isLowVirtue()) {
        await ui.notifications.error(game.i18n.localize('HV.errors.lowVirtue'));
        return false;
      }
    } else if (item.system.class === 'student') {
      if (!this.actor.isStudent()) {
        await ui.notifications.error(game.i18n.localize('HV.errors.notStudent'));
        return false;
      }
      if (this.actor.isHighVirtue()) {
        await ui.notifications.error(game.i18n.localize('HV.errors.highVirtue'));
        return false;
      }
    }
    const level = Number.parseInt(item.system.level);
    const spellSlots = this.actor.getSpellSlots();
    if (this.actor.system.spells[level - 1].length >= spellSlots[level - 1]) {
      await ui.notifications.error(game.i18n.format('HV.errors.maxSpells', { level: level }));
      return false;
    }
    return true;
  }

  /**
   *
   * @param event
   * @param source
   * @returns
   */
  async _sortPossession(event, source): Promise<void> {
    const positionTarget = event.target.closest('[data-column]');
    const columnID = positionTarget ? positionTarget.dataset.column : 'mount';
    let containerTarget;
    if (columnID === 'mount') {
      containerTarget = event.target.closest('[data-item-id]')?.dataset.itemId;
    }
    if (!containerTarget) {
      const availableSlots = this._calculateAvailableSlots();
      log.debug(`_onSortPossession() |encumbrance of item is ${source.system.encumbrance} `);
      // const ok = availableSlots[columnID] - source.system.encumbrance >= 0;
      const ok = !(columnID === 'worn' && availableSlots['worn'] <= 0);
      log.debug(`_onSortPossession() | ${ok} we have space, will place it at ${columnID} `);
      if (ok) source.setFlag('helveczia', 'position', columnID);
      source.unsetFlag('helveczia', 'in-container');
    } else {
      const container = this.actor.items.find((i) => i.id === containerTarget && i.type === 'container');
      const capacity = Number.parseInt(container?.system.capacity) || 0;
      const usedSlots = container?.sheet._usedSlots();
      if (capacity - usedSlots > 0) {
        await ContainerItem.insertItem(container, source, source.link);
      } else {
        ui.notifications.warn('HV.items.noSpaceLeft', { localize: true });
      }
    }
  }

  /** @override */
  _onSortItem(event, itemData): Promise<HVItem[] | void> | undefined {
    const source = this.actor.items.get(itemData._id);

    switch (source?.type) {
      case 'armour':
      case 'possession':
      case 'weapon':
      case 'book':
        return this._sortPossession(event, source);
      default:
        return super._onSortItem(event, itemData);
    }
  }
}
