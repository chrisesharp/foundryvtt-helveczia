import { ActorData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/module.mjs';
import { CharacterActorData, HVActorData, NPCActorData } from './actor-types';
import { Logger } from '../logger';
import { HVDice } from '../dice';

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
    this._categoriseItems(actorData);

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

  _categoriseItems(actorData) {
    const data = actorData.data;
    const categories = actorData.items.reduce(
      (acc, item) => {
        const category = acc[item.type] || [];
        category.push(item);
        acc[item.type] = category;
        return acc;
      },
      { possession: [], people: [], class: [], skill: [], armour: [], weapon: [], deed: [] },
    );

    data.possessions = {
      articles: categories['possession'],
      weapons: categories['weapon'],
      armour: categories['armour'],
    };
    data.skills = categories['skill'];
    data.peoples = categories['people'];
    data.classes = categories['class'];
    data.deeds = categories['deed'];
  }

  /**
   * Prepare Character type specific data
   */
  async _prepareCharacterData(actorData: ActorData) {
    const data = actorData.data;

    for (const key of Object.keys(data.scores)) {
      this._updateAbility(data.scores[key]);
    }

    this._updateSaves(data);
    this._updateCombatValues(data);
  }

  /**
   * Prepare NPC type specific data
   */
  async _prepareNPCData(actorData: ActorData) {
    const data = actorData.data;

    for (const key of Object.keys(data.scores)) {
      this._updateAbility(data.scores[key]);
    }

    this._updateSaves(data);
    this._updateCombatValues(data);
  }

  /**
   * Calculate current level from experience
   */
  _calculateLevel(experience: number): number {
    return (
      Object.entries(CONFIG.HV.XPLevels)
        .filter((x) => x[1] <= experience)
        .map((e) => parseInt(e[0]))
        .sort()
        .pop() ?? 1
    );
  }

  /**
   * Prepare Combat related values
   */
  _updateCombatValues(data) {
    data.initiative = data.scores.dex.mod;
    this._updateAC(data);
    this._updateAttackMods(data);
  }
  /**
   * Prepare AC based on mods
   * @param data
   */

  _updateAC(data: any): void {
    data.ac += data.scores.dex.mod;
  }

  /**
   * Prepare attack mods based on mods
   * @param data
   */

  _updateAttackMods(data: any): void {
    data.attack.melee.bonus = data.scores.str.mod;
    data.attack.ranged.bonus = data.scores.dex.mod;
    data.attack.melee.mod = data.attack.melee.base + data.attack.melee.bonus;
    data.attack.ranged.mod = data.attack.ranged.base + data.attack.ranged.bonus;
  }

  /**
   * Update base & bonus for saves
   */
  _updateSaves(data: any) {
    data.saves.bravery.bonus = data.scores.con.mod;
    data.saves.deftness.bonus = data.scores.dex.mod;
    data.saves.temptation.bonus = data.scores.wis.mod;
    const virtue = data.virtue > 14 ? 1 : 0;

    for (const saveType of Object.keys(data.saves)) {
      const save = data.saves[saveType];
      save.bonus += virtue;
      save.mod = save.base + save.bonus;
    }
  }

  /**
   * Update current bonus for ability
   */
  _updateAbility(ability: { value: number; mod: number }) {
    ability.value = Math.min(Math.max(ability.value, 0), 18);
    ability.mod = Math.round(ability.value / 3) - 3;
  }

  // Manage potential effect collisions here
  /** @override */
  applyActiveEffects() {
    super.applyActiveEffects();
  }

  applyCustomEffect(changeData) {
    const key = changeData.key;
    let change: { type?: string; primary?: boolean; value?: string } = {};
    try {
      change = changeData.value ? JSON.parse(changeData.value) : {};
    } catch (err) {
      log.debug('applyCustomEffect() | error: ', err);
    }
    switch (change?.type) {
      case 'save':
        this._applySave({ key: key, primary: change.primary });
        break;
      case 'attack_bonus':
        this._applyAttackBonus({ key: key, value: change.value });
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

  _applyAttackBonus(change) {
    const { key, value } = change;
    const lvl = foundry.utils.getProperty(this.data, 'data.level') ?? 1;
    if (!isNaN(lvl)) {
      const melee = `${key}.melee.base`;
      const ranged = `${key}.ranged.base`;
      const base = value === 'fighter' ? lvl : Math.floor((lvl * 2) / 3);
      foundry.utils.setProperty(this.data, melee, base);
      foundry.utils.setProperty(this.data, ranged, base);
    }
  }

  async rollCheck(data, opponent): Promise<any> {
    const attribute = data.attr;
    const resource = data.resource;
    const mod = this.data.data[resource][attribute].mod;
    const longName = game.i18n.format(`HV.${resource}.${attribute}.long`);
    const label = `Rolling ${longName} check`;
    const rollParts = ['1d20', mod];
    const rollData = {
      actor: this,
      roll: {
        type: 'check',
        target: CONFIG.HV.difficulties['Normal'],
      },
      opponent: opponent,
    };

    const skip = false;

    return HVDice.Roll({
      parts: rollParts,
      data: rollData,
      skipDialog: skip,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavour: label,
      title: label,
      chatMessage: true,
    });
  }

  /**
   * Override getRollData() supplied to roll
   */
  /** @override */
  getRollData() {
    const data = super.getRollData();
    this._getCharacterRollData(data as CharacterActorData['data']);
    this._getNPCRollData(data as NPCActorData['data']);
    return data;
  }

  _getCharacterRollData(data: CharacterActorData['data']): void {
    if (this.data.type !== 'character') return;
    // log.debug('Character RollData:', data);
    if (data?.scores) {
      for (const [k, v] of Object.entries(data.scores)) {
        data[k] = v;
      }
    }
  }

  _getNPCRollData(data: NPCActorData['data']): void {
    if (this.data.type !== 'npc') return;
    // log.debug('NPC RollData:', data);
    if (data?.scores) {
      for (const [k, v] of Object.entries(data.scores)) {
        data[k] = v;
      }
    }
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
