import { CharacterActorData, HVActorData, NPCActorData } from './actor-types';
import { Logger } from '../logger';
import { HVDice } from '../dice';
import { Student } from '../items/class/student';
import { Cleric } from '../items/class/cleric';
import { Fighter } from '../items/class/fighter';
import { SkillItemData, WeaponItemData } from '../items/item-types';
import { PeopleItem } from '../items/people/people-item';
import { HVItem } from '../items/item';

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
    switch (this.type) {
      case 'character':
        {
          const data = this.system;
          data.ac = 10;
          data.npcModBonus = 0;
          data.level = this._calculateLevel(data.experience);
        }
        break;
      case 'npc':
        this.calculateNPCThreatLevel();
        break;
      case 'party':
        this.setPartyData();
        break;
    }
  }

  calculateNPCThreatLevel(): void {
    const data = this.system;
    data.ac = data.baseAC;
    const groups = data.levelBonus.match(/(?<class>[a-zA-Z\s]*)(?<lvl>\d)\+?(?<threat>[\d\*]*)/)?.groups;
    data.level = parseInt(groups?.lvl ?? 1);
    let threat = 0;
    data.npcModBonus = 0;
    if (groups?.threat?.length > 0) {
      const bonus = isNaN(groups.threat[0]) ? 0 : parseInt(groups.threat[0]);
      data.npcModBonus = bonus;
      data.ac -= bonus;
      threat = groups.threat.length - 1;
    }
    data.experience = CONFIG.HV.challengeAwards[data.level + threat];
  }

  setPartyData(): void {
    this.img = this.prototypeToken.texture.src;
    this.prototypeToken.name = this.name;
  }

  /** @override */
  prepareDerivedData(): void {
    this._categoriseItems();

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    switch (this.type) {
      case 'character':
        this._prepareCharacterData();
        break;
      case 'npc':
        this._prepareNPCData();
        break;
    }
  }

  _categoriseItems() {
    const data = this.system;

    data.possessions = {
      articles: this.itemTypes['possession'].concat(this.itemTypes['book']),
      weapons: this.itemTypes['weapon'],
      armour: this.itemTypes['armour'].sort((a, b) => b.system.bonus - a.system.bonus),
    };
    data.skills = this.itemTypes['skill'];
    data.peoples = this.itemTypes['people'];
    data.classes = this.itemTypes['class'].filter((i) => i.system.specialism === false);
    data.specialisms = this.itemTypes['class'].filter((i) => i.system.specialism);
    data.deeds = this.itemTypes['deed'];
    data.sins = this.itemTypes['deed']
      .filter((d) => d.system.subtype === 'sin')
      .sort((a, b) => {
        const first = 0 - a.system.magnitude;
        const second = 0 - b.system.magnitude;
        return first - second;
      });
    data.virtues = this.itemTypes['deed']
      .filter((d) => d.system.subtype === 'virtue')
      .sort((a, b) => {
        const first = a.system.magnitude;
        const second = b.system.magnitude;
        return first - second;
      });
    data.spells = [[], [], []];
    if (this.itemTypes['spell'].length) {
      data.spells = this.itemTypes['spell'].reduce(
        (acc, item) => {
          const level = item.system.level - 1;
          acc[level].push(item);
          return acc;
        },
        [[], [], []],
      );
    }
    data.people = data.peoples[0]?.name;
    data.class = data.classes[0]?.name;
  }

  /**
   * Prepare Character type specific data
   */
  async _prepareCharacterData() {
    const data = this.system;

    for (const key of Object.keys(data.scores)) {
      this._updateAbility(data.scores[key]);
    }

    this._calculateCapacity(data);
    this._updateSaves(data);
    this._updateSkills(data);
    this._updateCombatValues(data);
  }

  /**
   * Prepare NPC type specific data
   */
  async _prepareNPCData() {
    const data = this.system;

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
   * Calculate encumbrance capacity from strength
   */
  _calculateCapacity(data): void {
    data.capacity = 16 - (6 - Math.round(data.scores.str.value / 3));
  }

  /**
   * Prepare Combat related values
   */
  _updateCombatValues(data) {
    data.initiative += data.scores.dex.mod + data.npcModBonus;
    this._updateAC(data);
    this._updateAttackMods(data);
  }
  /**
   * Prepare AC based on mods
   * @param data
   */

  _updateAC(data: any): void {
    data.ac += data.scores.dex.mod + data.npcModBonus;
    const armour = data.possessions.armour
      .filter((i) => i.getFlag('helveczia', 'position') === 'worn' && i.system.shield === false)
      .map((i) => i.system.bonus)
      .sort((a, b) => {
        return b - a;
      });
    const bestArmour = armour.shift() ?? 0;
    const shields = data.possessions.armour
      .filter((i) => i.getFlag('helveczia', 'position') === 'worn' && i.system.shield === true)
      .map((i) => i.system.bonus)
      .sort((a, b) => {
        return b - a;
      });
    const bestShield = shields.shift() ?? 0;
    data.ac += bestArmour + bestShield;
  }

  /**
   * Prepare attack mods based on mods
   * @param data
   */

  _updateAttackMods(data: any): void {
    const virtue = this.isLowVirtue() ? 1 : 0;
    const lvl = data.level;
    const base = this.isFighter() || this.isNoClass() ? lvl : Math.floor((lvl * 2) / 3);
    data.attack.melee.base = base;
    data.attack.ranged.base = base;
    data.attack.cc.base = base;
    data.attack.melee.bonus += data.scores.str.mod + virtue + data.npcModBonus;
    data.attack.ranged.bonus += data.scores.dex.mod + virtue + data.npcModBonus;
    data.attack.cc.bonus += virtue + data.npcModBonus;
    data.attack.melee.mod = data.attack.melee.base + data.attack.melee.bonus;
    data.attack.ranged.mod = data.attack.ranged.base + data.attack.ranged.bonus;
    data.attack.cc.mod = data.attack.cc.base + data.attack.cc.bonus;
  }

  /**
   * Update base & bonus for saves
   */
  _updateSaves(data: any) {
    if (this.type === 'npc' && data.stats.saves) {
      data.saves.bravery.mod = parseInt(data.stats.saves.bravery);
      data.saves.deftness.mod = parseInt(data.stats.saves.deftness);
      data.saves.temptation.mod = parseInt(data.stats.saves.temptation);
    } else {
      const virtue = this.isHighVirtue() ? 1 : 0;
      data.saves.bravery.bonus += data.scores.con.mod + virtue + data.npcModBonus;
      data.saves.deftness.bonus += data.scores.dex.mod + virtue + data.npcModBonus;
      data.saves.temptation.bonus += data.scores.wis.mod + virtue + data.npcModBonus;

      const bases = data.classes.length > 0 ? data.classes[0]?.getSaveBase(this) : Fighter.getSaveBase(this);
      for (const saveType of Object.keys(data.saves)) {
        const save = data.saves[saveType];
        save.base = bases ? bases[saveType] : 0;
        save.mod = save.base + save.bonus;
      }
    }
  }

  /**
   * Update base & bonus for skills
   */
  async _updateSkills(data: any) {
    const peopleBonus = data.peoples[0]?.getSkillsBonus(this) ?? 0;
    const classBonus = data.classes[0]?.getSkillsBonus(this) ?? 0;
    data.maxskills += data.scores.int.mod + peopleBonus + classBonus + data.npcModBonus;
    log.debug(
      `HVActor._updateSkills() | max skills are int(${data.scores.int.mod}) + peoples(${peopleBonus}) + class(${classBonus})`,
    );
  }

  /**
   * Update current bonus for ability
   */
  _updateAbility(ability: { value: number; mod: number }) {
    ability.value = Math.min(Math.max(ability.value, 0), 18);
    ability.mod = Math.floor(ability.value / 3) - 3;
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
    const current = foundry.utils.getProperty(this.system, key) ?? null;
    log.debug(`_applySave() | current value of ${key} is ${current}`);
    let update = '';
    const lvl = foundry.utils.getProperty(this.system, 'level') ?? null;
    log.debug(`_applySave() | level is ${lvl}`);
    if (!isNaN(lvl)) {
      log.debug('Primary?:', primary);
      update =
        primary === 'true' || primary === true ? current + Math.floor(lvl / 2) + 2 : current + Math.floor(lvl / 2);
    }
    log.debug('_applySave() | update is ', key, update);
    if (update !== '') {
      foundry.utils.setProperty(this.system, key, update);
    }
  }

  _applyAttackBase(change) {
    const { key, value } = change;
    const melee = `${key}.melee.base`;
    const ranged = `${key}.ranged.base`;
    const lvl = foundry.utils.getProperty(this.system, 'level') ?? 1;
    const currentMeleeBase = foundry.utils.getProperty(this.system, 'melee') ?? 0;
    const currentRangedBase = foundry.utils.getProperty(this.system, 'ranged') ?? 0;
    if (!isNaN(lvl)) {
      const base = value === 'fighter' ? lvl : Math.floor((lvl * 2) / 3);
      foundry.utils.setProperty(this.system, melee, currentMeleeBase + base);
      foundry.utils.setProperty(this.system, ranged, currentRangedBase + base);
    }
  }

  _applyBonus(change) {
    const { key, value } = change;
    const currentBonus = foundry.utils.getProperty(this.system, key) ?? 0;
    foundry.utils.setProperty(this.system, key, currentBonus + parseInt(value));
  }

  _applyRandomSaveBonus(_change) {
    // console.log('Apply random save bonus:', change);
  }

  async rollCheck({ mods, longName, dmg, item }, opponent): Promise<any> {
    const label = game.i18n.format('HV.rollCheck', { type: longName });
    const rollParts = ['1d20'];
    mods.forEach((m) => rollParts.push(m));
    const rollData = {
      actor: this,
      roll: {
        type: 'check',
        target: CONFIG.HV.difficulties['Normal'],
        dmg: dmg,
      },
      opponent: opponent,
      item: item,
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
    this._getCharacterRollData(data as CharacterActorData['system']);
    this._getNPCRollData(data as NPCActorData['system']);
    return data;
  }

  _getCharacterRollData(data: CharacterActorData['system']): void {
    if (this.type !== 'character') return;
    // log.debug('Character RollData:', data);
    if (data?.scores) {
      for (const [k, v] of Object.entries(data.scores)) {
        data[k] = v;
      }
    }
  }

  _getNPCRollData(data: NPCActorData['system']): void {
    if (this.type !== 'npc') return;
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
    data.prototypeToken = data.prototypeToken || {};

    const disposition = data.type !== 'npc' ? CONST.TOKEN_DISPOSITIONS.FRIENDLY : CONST.TOKEN_DISPOSITIONS.HOSTILE;
    // Set basic token data for newly created actors.

    const defaultToken = data.type === 'party' ? CONFIG.HV.DEFAULT_PARTY : CONFIG.HV.DEFAULT_TOKEN;

    foundry.utils.mergeObject(
      data,
      {
        img: defaultToken,
      },
      { overwrite: false },
    );

    foundry.utils.mergeObject(
      data.prototypeToken,
      {
        displayName: CONST.TOKEN_DISPLAY_MODES.HOVER,
        actorLink: true,
        disposition: disposition,
        lockRotation: true,
        texture: {
          src: data.img,
        },
      },
      { overwrite: false },
    );

    this.updateSource(data);
  }

  isNoClass(): boolean {
    return this.type === 'npc' && this.itemTypes['class'].length == 0;
  }

  isFighter(): boolean {
    return this.isNamedType('fighter', 'class');
  }

  isVagabond(): boolean {
    return this.isNamedType('vagabond', 'class');
  }

  isCleric(): boolean {
    return this.isNamedType('cleric', 'class');
  }

  isStudent(): boolean {
    return this.isNamedType('student', 'class');
  }

  isHungarian(): boolean {
    return this.isNamedType('hungarian', 'people');
  }

  isCzech(): boolean {
    return this.isNamedType('czech', 'people');
  }

  isDutch(): boolean {
    return this.isNamedType('dutch', 'people');
  }

  isItalian(): boolean {
    return this.isNamedType('italian', 'people');
  }

  isNamedType(name: string, type: string): boolean {
    const localName = game.i18n.localize(`HV.${type}.${name}`);
    const namedClass = this.itemTypes[type].find((i) => i.name === localName);
    return namedClass !== undefined;
  }

  isLowVirtue(): boolean {
    return this.system.virtue <= 7;
  }

  isHighVirtue(): boolean {
    return this.system.virtue > 14;
  }

  getSpellSlots(): number[] {
    if (this.isStudent()) return Student.getSpellSlots(this);
    else if (this.isCleric()) return Cleric.getSpellSlots(this);
    return [];
  }

  getSpellBonus(): number[] {
    let attr = 0;
    if (this.isStudent()) {
      attr = this.system.scores.int.value;
    } else if (this.isCleric()) {
      attr = this.system.scores.wis.value;
    }

    const spells = [0, 0, 0];
    if (attr >= 12) spells[0] = 1;
    if (attr >= 15) spells[1] = 1;
    if (attr >= 18) spells[2] = 1;
    return spells;
  }

  async getRollMods(data): Promise<{ mods: number[]; longName: string; dmg: string[]; item: HVItem | undefined }> {
    log.debug('getRollMods() | get roll mods for ', data);
    let longName = '';
    const dmg: string[] = [];
    const mod: number[] = [];
    const item = data?.itemId ? this.items.get(`${data.itemId}`) : undefined;
    switch (data.roll) {
      case 'attr':
        data.resource = 'scores';
        break;
      case 'save':
        data.resource = 'saves';
        if (this.isHungarian()) {
          const fated = await PeopleItem.enableHungarianFate(this);
          if (data.attr === fated.attr) mod.push(fated.mod);
        }
        break;
      case 'skill':
        data.resource = '';
        mod.push(this.system.level);
        break;
      case 'weapon':
        data.resource = '';
        if (item) {
          dmg.push((item.system as WeaponItemData).damage);
        } else {
          dmg.push('1d3');
        }
        break;
      case 'attack':
        data.resource = 'attack';
        if (data.attr !== 'cc') dmg.push('1d3');
        break;
      default:
        break;
    }
    const attribute = data.attr;
    const resource = data.resource;
    if (resource !== '' && attribute) {
      mod.push(this.system[resource][attribute].mod);
      longName = game.i18n.format(`HV.${resource}.${attribute}.long`);
      log.debug(
        `getRollMods() | name:${longName} - resource=${resource}, attribute=${attribute}, mod=${mod.join('+')}, item=`,
        item,
      );
    } else {
      log.debug(`getRollMods() | itemId:${data.itemId}`);
      if (item) {
        switch (item.type) {
          case 'skill':
            {
              const skill = item.system as SkillItemData;
              const bonus = Math.floor(skill.bonus);
              const ability = this.system.scores[skill.ability]?.mod;
              mod.push(bonus);
              mod.push(ability);
              longName = item.name ?? game.i18n.localize('HV.skill');
              log.debug(`getRollMods() | name:${longName} - ability=${skill.ability}, bonus=${bonus}`);
            }
            break;
          case 'weapon':
            {
              const weapon = item.system as WeaponItemData;
              const bonus = Math.floor(weapon.bonus);
              const ability = this.system.attack[weapon.attack]?.mod;
              if (weapon.attack === 'melee') dmg.push(this.system.attack.melee?.bonus);
              mod.push(bonus);
              mod.push(ability);
              longName = item.name ?? game.i18n.localize('HV.items.weapon');
              log.debug(`getRollMods() | name:${longName} - attack=${weapon.attack}, bonus=${bonus}`);
            }
            break;
          default:
            break;
        }
      } else {
        log.error('getRollMods() | itemId not found on actor');
      }
    }
    return { mods: mod, longName: longName, dmg: dmg, item: item };
  }

  async getItemRollMod(itemID: string): Promise<string> {
    const item = this.items.get(itemID);
    let mods = '0';
    if (item) {
      switch (item.type) {
        case 'skill':
          {
            const itemData = item.system as SkillItemData;
            const data = await this.getRollMods({ attr: itemData.ability, roll: item.type, itemId: item.id });
            const value = data.mods.reduce((acc, n) => acc + n, 0);
            mods = value > 0 ? `+${value}` : `${value}`;
          }
          break;
        case 'weapon':
          {
            const data = await this.getRollMods({ roll: item.type, itemId: item.id });
            const value = data.mods.reduce((acc, n) => acc + n, 0);
            mods = value > 0 ? `+${value}` : `${value}`;
          }
          break;
      }
    }
    return mods;
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
