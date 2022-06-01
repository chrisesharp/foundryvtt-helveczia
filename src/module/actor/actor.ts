import { ActorData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/module.mjs';
import { CharacterActorData, HVActorData, NPCActorData } from './actor-types';
import { Logger } from '../logger';
import { HVDice } from '../dice';
import { Student } from '../items/class/student';
import { Cleric } from '../items/class/cleric';

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

  /** @override */
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
      { possession: [], people: [], class: [], skill: [], armour: [], weapon: [], deed: [], spell: [] },
    );

    data.possessions = {
      articles: categories['possession'],
      weapons: categories['weapon'],
      armour: categories['armour'],
    };
    data.skills = categories['skill'];
    data.peoples = categories['people'];
    data.classes = categories['class'].filter((i) => i.data.data.specialism === false);
    data.specialisms = categories['class'].filter((i) => i.data.data.specialism);
    data.deeds = categories['deed'];
    data.spells = categories['spell'];
    data.people = data.peoples[0]?.name;
    data.class = data.classes[0]?.name;
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
    this._updateSkills(data);
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
    this._updateSkills(data);
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
    data.initiative += data.scores.dex.mod;
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
    const virtue = this.isLowVirtue() ? 1 : 0;
    data.attack.melee.bonus += data.scores.str.mod + virtue;
    data.attack.ranged.bonus += data.scores.dex.mod + virtue;
    data.attack.melee.mod = data.attack.melee.base + data.attack.melee.bonus;
    data.attack.ranged.mod = data.attack.ranged.base + data.attack.ranged.bonus;
  }

  /**
   * Update base & bonus for saves
   */
  _updateSaves(data: any) {
    data.saves.bravery.bonus += data.scores.con.mod;
    data.saves.deftness.bonus += data.scores.dex.mod;
    data.saves.temptation.bonus += data.scores.wis.mod;
    const virtue = this.isHighVirtue() ? 1 : 0;

    for (const saveType of Object.keys(data.saves)) {
      const save = data.saves[saveType];
      save.bonus += virtue;
      save.mod = save.base + save.bonus;
    }
  }

  /**
   * Update base & bonus for saves
   */
  async _updateSkills(data: any) {
    const peopleBonus = data.peoples[0]?.getSkillsBonus(this) ?? 0;
    const classBonus = data.classes[0]?.getSkillsBonus(this) ?? 0;
    data.maxskills += data.scores.int.mod + peopleBonus + classBonus;
    log.debug(
      `HVActor._updateSkills() | max skills are int(${data.scores.int.mod}) + peoples(${peopleBonus}) + class(${classBonus})`,
    );
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
        this._applyAttackBase({ key: key, value: change.value });
        break;
      case 'random_save':
        this._applyRandomSaveBonus({ key: key, value: change.value });
        break;
      case 'czech_prowess':
        if (this.isFighter() || this.isVagabond()) this._applyBonus({ key: key, value: change.value });
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

  _applyAttackBase(change) {
    const { key, value } = change;
    const melee = `${key}.melee.base`;
    const ranged = `${key}.ranged.base`;
    const lvl = foundry.utils.getProperty(this.data, 'data.level') ?? 1;
    const currentMelee = foundry.utils.getProperty(this.data, melee) ?? 0;
    const currentRanged = foundry.utils.getProperty(this.data, ranged) ?? 0;
    if (!isNaN(lvl)) {
      const base = value === 'fighter' ? lvl : Math.floor((lvl * 2) / 3);
      foundry.utils.setProperty(this.data, melee, currentMelee + base);
      foundry.utils.setProperty(this.data, ranged, currentRanged + base);
    }
  }

  _applyBonus(change) {
    const { key, value } = change;
    const currentBonus = foundry.utils.getProperty(this.data, key) ?? 0;
    foundry.utils.setProperty(this.data, key, currentBonus + parseInt(value));
  }

  _applyRandomSaveBonus(_change) {
    // TODO implement Hungarian Fate
    // console.log('Apply random save bonus:', change);
  }

  async rollCheck({ mods, longName }, opponent): Promise<any> {
    const label = game.i18n.format('HV.rollCheck', { type: longName });
    const rollParts = ['1d20'];
    mods.forEach((m) => rollParts.push(m));
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
        img: CONFIG.HV.DEFAULT_TOKEN,
      },
      { overwrite: false },
    );

    mergeObject(
      data,
      {
        img: CONFIG.HV.DEFAULT_TOKEN,
      },
      { overwrite: false },
    );
    this.data.update(data);
  }

  isFighter(): boolean {
    return this.isNamedType('Fighter', 'class');
  }

  isVagabond(): boolean {
    return this.isNamedType('Vagabond', 'class');
  }

  isCleric(): boolean {
    return this.isNamedType('Cleric', 'class');
  }

  isStudent(): boolean {
    return this.isNamedType('Student', 'class');
  }

  isHungarian(): boolean {
    return this.isNamedType('Hungarian', 'people');
  }

  isDutch(): boolean {
    return this.isNamedType('Dutch', 'people');
  }

  isItalian(): boolean {
    return this.isNamedType('Italian', 'people');
  }

  isNamedType(name: string, type: string): boolean {
    const actorData = this.data;
    const namedClass = actorData.items.find((i) => i.type === type && i.name === name);
    return namedClass !== undefined;
  }

  isLowVirtue(): boolean {
    return this.data.data.virtue < 7;
  }

  isHighVirtue(): boolean {
    return this.data.data.virtue > 14;
  }

  getSpellSlots(): number[] {
    if (this.isStudent()) return Student.getSpellSlots(this);
    else if (this.isCleric()) return Cleric.getSpellSlots(this);
    return [];
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
