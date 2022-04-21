import { ActorData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/module.mjs';
import { HVActorData } from './actor-types';
import { Logger } from '../logger';

const log = new Logger();

export class HVActor extends Actor {
  /**
   * Augment the basic actor data with additional dynamic data.
   */
  /** @override */
  prepareData() {
    super.prepareData();
  }

  /** @override */
  prepareBaseData(): void {
    const actorData = this.data;
    const data = actorData.data;
    // const flags = actorData.flags;
    data.ac = 10;
    data.level = this._calculateLevel(data.experience);
  }

  prepareDerivedData(): void {
    const actorData = this.data;
    // const data = actorData.data;
    // const flags = actorData.flags;

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    switch (actorData.type) {
      case 'character':
        this._prepareCharacterData(actorData);
        break;
      case 'npc':
        this._prepareNPCData(actorData);
        break;
    }
  }

  _categoriseItems(items) {
    return items.reduce(
      (acc, item) => {
        const category = acc[item.type] || [];
        category.push(item);
        acc[item.type] = category;
        return acc;
      },
      { possession: [], people: [], class: [], skill: [], armour: [], weapon: [], deed: [] },
    );
  }

  /**
   * Prepare Character type specific data
   */
  async _prepareCharacterData(actorData: ActorData) {
    const data = actorData.data;
    const categories = this._categoriseItems(actorData.items);
    data.possessions = {
      articles: categories['possession'],
      weapons: categories['weapon'],
      armour: categories['armour'],
    };
    data.skills = categories['skill'];
    data.peoples = categories['people'];
    data.classes = categories['class'];
    data.deeds = categories['deed'];

    for (const key of Object.keys(data.scores)) {
      this._updateAbility(data.scores[key]);
    }

    this._updateSaves(data);

    this._updateAC(data);
  }

  /**
   * Prepare NPC type specific data
   */
  async _prepareNPCData(actorData: ActorData) {
    const data = actorData.data;
    const categories = this._categoriseItems(actorData.items);
    data.possessions = {
      articles: categories['possession'],
      weapons: categories['weapon'],
      armour: categories['armour'],
    };
    data.skills = categories['skill'];
    data.peoples = categories['people'];
    data.classes = categories['class'];
    data.deeds = categories['deed'];

    for (const key of Object.keys(data.scores)) {
      this._updateAbility(data.scores[key]);
    }

    this._updateSaves(data);

    this._updateAC(data);
  }

  /**
   * Calculate current level from experience
   */
  _calculateLevel(experience: number) {
    let level = 1;
    if (experience >= 30000) {
      level = 6;
    } else if (experience >= 20000) {
      level = 5;
    } else if (experience >= 12000) {
      level = 4;
    } else if (experience >= 6000) {
      level = 3;
    } else if (experience >= 2000) {
      level = 2;
    }
    return level;
  }

  /**
   * Prepare AC based on mods
   * @param data
   */

  _updateAC(data: any): void {
    data.ac += data.scores.dex.mod;
  }

  /**
   * Update base & bonus for saves
   */
  _updateSaves(data: any) {
    data.saves.bravery.bonus = data.scores.con.mod;
    data.saves.deftness.bonus = data.scores.dex.mod;
    data.saves.temptation.bonus = data.scores.wis.mod;
  }

  /**
   * Update current bonus for ability
   */
  _updateAbility(ability: { value: number; mod: number }) {
    ability.value = Math.min(Math.max(ability.value, 0), 18);
    ability.mod = Math.round(ability.value / 3) - 3;
  }

  // Armour is not cumulative in effect, so disable the weaker ones
  // Effectiveness is measured as larger negative number
  /** @override */
  applyActiveEffects() {
    // const armourEffects = {};
    // let mostEffective = 0;
    // let mostEffectiveId = "not set";
    // this.effects.forEach ((e) => {
    //   let armourChanges = e.data.changes.filter(x=>(x.key === "data.ac"));
    //   if (armourChanges.length) {
    //     if (e.id) {
    //       armourEffects[e.id] = e;
    //       let value = parseInt(e.data.changes[0].value)
    //       if (value < mostEffective) {
    //         mostEffective = value;
    //         mostEffectiveId = e.id;
    //       }
    //     }
    //   }
    // });

    // Object.keys(armourEffects).forEach((id) => {
    //   armourEffects[id].data.disabled = (mostEffectiveId != id);
    // });
    super.applyActiveEffects();
  }

  applyCustomEffect(changeData) {
    const key = changeData.key;
    let change: { type?: string; primary?: boolean } = {};
    try {
      change = changeData.value ? JSON.parse(changeData.value) : {};
    } catch (err) {
      log.debug('applyCustomEffect() | error: ', err);
    }
    switch (change?.type) {
      case 'save':
        this._applySave({ key: key, primary: change.primary });
        break;
    }
  }

  _applySave(change) {
    const { key, primary } = change;
    const current = foundry.utils.getProperty(this.data, key) ?? null;
    log.debug(`_applySave() | current value of ${key} is ${current}`);
    let update = '';
    const lvl = foundry.utils.getProperty(this.data, 'data.level') ?? null;
    log.debug(`_applySave() | level is ${lvl}`);
    if (!isNaN(lvl)) {
      log.debug('Primary?:', primary);
      update =
        primary === 'true' || primary === true ? current + Math.floor(lvl / 2) + 2 : current + Math.floor(lvl / 2);
    }
    log.debug('_applySave() | update is ', key, update);
    if (update !== '') {
      foundry.utils.setProperty(this.data, key, update);
    }
  }

  /**
   * Override getRollData() supplied to roll
   */
  /** @override */
  getRollData() {
    const data = super.getRollData();
    this._getCharacterRollData(data);
    this._getNPCRollData(data);
    return data;
  }

  _getCharacterRollData(data: object): void {
    if (this.data.type !== 'character') return;
    log.debug('Character RollData:', data);
  }

  _getNPCRollData(data: object): void {
    if (this.data.type !== 'npc') return;
    log.debug('NPC RollData:', data);
  }

  /** @override */
  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);
    data.token = data.token || {};

    const disposition = data.type === 'character' ? 1 : -1;
    // Set basic token data for newly created actors.
    mergeObject(
      data.token,
      {
        vision: true,
        dimSight: 30,
        brightSight: 0,
        actorLink: true,
        disposition: disposition,
      },
      { overwrite: false },
    );

    // Overwrite specific token data (used for template actors)
    mergeObject(
      data.token,
      {
        img: CONST.DEFAULT_TOKEN,
      },
      { overwrite: true },
    );
    this.data.update(data);
  }
}

declare global {
  interface DocumentClassConfig {
    Actor: typeof HVActor;
  }

  interface DataConfig {
    Actor: HVActorData;
  }
}
