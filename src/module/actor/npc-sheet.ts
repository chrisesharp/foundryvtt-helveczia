import { prepareActiveEffectCategories } from '../effects';
import { HVItem } from '../items/item';
import { Logger } from '../logger';
import { HVActorSheet } from './actor-sheet';

const log = new Logger();

export class HVNPCSheet extends HVActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['helveczia', 'sheet', 'actor', 'npc'],
      template: 'systems/helveczia/templates/actor/npc-sheet.hbs',
      width: 580,
      height: 730,
      resizable: true,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'combat' }],
    });
  }

  /** @override */
  async getData() {
    const baseData = await super.getData();
    const actorData = baseData.actor;
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
    };
    // Add actor, actor data and item
    data.actor = actorData;
    data.data = data.actor.system;
    data.items = this.actor.items.map((i) => i.system);
    data.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    data.possessions = data.data.possessions;
    data.effects = prepareActiveEffectCategories(this.actor.allApplicableEffects());
    data.spellGroups = [1, 2, 3];

    data.enrichedDescription = await TextEditor.enrichHTML(this.object.system.description, { async: true });
    return data;
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
    let item;
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
}
