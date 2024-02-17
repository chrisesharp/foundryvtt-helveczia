import { prepareActiveEffectCategories } from '../effects';
import { HVItem } from '../items/item';
import { Logger } from '../logger';
import { HVActor } from './actor';
import { HVActorSheet } from './actor-sheet';
import { CharacterActorData } from './actor-types';

const log = new Logger();

export class HVCharacterSheet extends HVActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['helveczia', 'sheet', 'actor', 'character'],
      template: 'systems/helveczia/templates/actor/character-sheet.hbs',
      width: 580,
      height: 730,
      resizable: true,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'abilities' }],
    });
  }

  /** @override */
  async getData() {
    const baseData = await super.getData();
    const actorData = baseData.actor;
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
    };
    // Add actor, actor data and item
    data.actor = actorData;
    data.data = data.actor.system;
    data.items = this.actor.items.map((i) => i);
    data.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    data.hasBible = data.items.filter((i) => i.name.includes('Bible')).length > 0;
    data.effects = prepareActiveEffectCategories(this.actor.effects);
    data.maxspecialisms = this.actor.isVagabond() ? ((actorData.system as CharacterActorData).level >= 5 ? 3 : 2) : 1;
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

    data.enrichedDescription = await TextEditor.enrichHTML(this.object.system.description, { async: true });
    return data;
  }

  /**
   *
   * @returns availableSlots : number
   */
  async _calculateAvailableSlots(): Promise<any> {
    const sheetData = await this.getData();
    const capacity = this.actor.system.capacity - 8;
    const wornUsed = sheetData.worn.map((i) => parseInt(i.system.encumbrance)).reduce((acc, n) => acc + n, 0);
    const carriedUsed = sheetData.carried.map((i) => parseInt(i.system.encumbrance)).reduce((acc, n) => acc + n, 0);
    const mountUsed = sheetData.mount.map((i) => parseInt(i.system.encumbrance)).reduce((acc, n) => acc + n, 0);
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
  async _onDropItem(event: DragEvent, data: ActorSheet.DropData.Item): Promise<unknown> {
    log.debug('_onDropItem() | ', event, data);
    let shouldContinue = true;
    let item;
    let position = 'mount';
    try {
      const transfer = event.dataTransfer?.getData('text/plain') ?? '';
      data = JSON.parse(transfer);
      if (data['pack']) {
        const pack = game.packs.get(data['pack']);
        item = await pack?.getDocument(data['uuid']);
      } else {
        item = await fromUuid(data['uuid']);
      }
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
        if (this.actor.system.skills.length == this.actor.system.maxskills) {
          return ui.notifications.error(game.i18n.localize('HV.errors.fullSkills'));
        }
        if (item.system.subtype === 'magical' && !(this.actor.isCleric() || this.actor.isStudent())) {
          return ui.notifications.error(game.i18n.localize('HV.errors.notMagical'));
        }
        if (item.system.subtype === 'vagabond' && !this.actor.isVagabond()) {
          return ui.notifications.error(game.i18n.localize('HV.errors.notVagabond'));
        }
        if ((item.system.subtype === 'craft' || item.system.subtype === 'science') && this.actor.isVagabond()) {
          return ui.notifications.error(game.i18n.localize('HV.errors.areVagabond'));
        }
        break;
      case 'spell':
        if (item.system.class === 'cleric') {
          if (!this.actor.isCleric()) {
            return ui.notifications.error(game.i18n.localize('HV.errors.notCleric'));
          }
          if (this.actor.isLowVirtue()) {
            return ui.notifications.error(game.i18n.localize('HV.errors.lowVirtue'));
          }
        } else if (item.system.class === 'student') {
          if (!this.actor.isStudent()) {
            return ui.notifications.error(game.i18n.localize('HV.errors.notStudent'));
          }
          if (this.actor.isHighVirtue()) {
            return ui.notifications.error(game.i18n.localize('HV.errors.highVirtue'));
          }
        }
        const level = parseInt(item.system.level);
        const spellSlots = this.actor.getSpellSlots();
        // console.log(`spellSlots: ${spellSlots[level-1]}, level:${level},spells.length:${this.actor.system.spells[level-1].length}`, this.actor.system.spells)
        if (this.actor.system.spells[level - 1].length >= spellSlots[level - 1]) {
          return ui.notifications.error(game.i18n.format('HV.errors.maxSpells', { level: level }));
        }
        break;
      case 'weapon':
      case 'armour':
      case 'book':
      case 'possession':
        const capacitySlots = await this._calculateAvailableSlots();
        log.debug('_onDropItem() | carrying capacity:', capacitySlots);
        log.debug('_onDropItem() | item encumbrance:', item.system.encumbrance);
        if (capacitySlots.worn >= item.system.encumbrance) {
          position = 'worn';
        } else if (capacitySlots.carried >= item.system.encumbrance) {
          position = 'carried';
        }
        shouldContinue = capacitySlots.carried + capacitySlots.worn + capacitySlots.mount >= item.system.encumbrance;
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
          case 'book':
          case 'possession':
            item.setFlag('helveczia', 'position', position);
            log.debug(`_onDropItem() | set position of item to ${position}`);
            break;
          case 'spell':
            await item.createChatMessage(this.actor, 'HV.SpellMemorize');
            break;
        }
      }
    }
    return;
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
    log.debug(`_onSortPossession() |encumbrance of item is ${source.system.encumbrance} `);
    const ok = availableSlots[columnID] - source.system.encumbrance >= 0;
    log.debug(`_onSortPossession() | ${ok} we have space, will place it at ${columnID} `);
    if (ok) source.setFlag('helveczia', 'position', columnID);
    return;
  }

  /** @override */
  _onSortItem(event, itemData): Promise<HVItem[]> | undefined {
    const source = this.actor.items.get(itemData._id);

    switch (source?.type) {
      case 'armour':
        this._sortPossession(event, source);
        return;
      case 'possession':
        this._sortPossession(event, source);
        return;
      case 'weapon':
        this._sortPossession(event, source);
        return;
      case 'book':
        this._sortPossession(event, source);
        return;
      default:
        return super._onSortItem(event, itemData);
    }
  }
}
