import { HVActor } from '../actor/actor';
import { Utils } from '../utils/utils';
import { HVCharacterCreator } from './chargen';

const levelBonusRegEx = /(?<class>[a-zA-Z\s]*)(?<lvl>\d)\+?(?<threat>[\d\*]*)/;
const skillRegEx = /(?<skillName>[\w’\/\s]+)(?<bonus>[\-\+]\d)*/;
const weaponRegEx = /(?<bonus>\+\d)+(?<weaponName>[a-zA-Z\s]*)+(?<dmg>\dd\d[\+]*[\d]*)*(?<notes>.*)/;

export class NPCGenerator extends FormApplication {
  static get defaultOptions() {
    const options = super.defaultOptions;
    (options.classes = ['helveczia', 'dialog', 'creator']), (options.id = 'npc-creator');
    options.template = 'systems/helveczia/templates/actor/dialogs/npc-creation.hbs';
    options.width = 435;
    options.height = 435;
    return options;
  }

  static getButton(sheet): Application.HeaderButton {
    const button: Application.HeaderButton = {
      label: game.i18n.localize('HV.Import'),
      class: 'configure-npc',
      icon: 'fa-solid fa-file-import',
      onclick: async () => {
        new NPCGenerator(sheet.actor, {
          top: (sheet.position.top ?? 0) + 40,
          left: (sheet.position.left ?? 0) + ((sheet.position.width ?? 0) - 400) / 2,
        }).render(true);
      },
    };
    return button;
  }

  async _onSubmit(event: Event): Promise<any> {
    event.preventDefault();
    const statblock = $('textarea#statblock').val() as string;
    let updateData = {};
    try {
      const npc = new Parser(statblock).npc;
      let description = '';
      if (npc.numAppearing?.length && npc.numAppearing != '1')
        description += `<p>Num appearing: ${npc.numAppearing}</p>\n`;
      if (npc.armour?.length) description += `<p>Armour: ${npc.armour}</p>\n`;
      for (const weapon of npc.atk) {
        description += `<p>${weapon.attack_bonus} ${weapon.name} ${weapon.dmg} ${weapon.details ?? ''}</p>`;
      }
      for (const skill of npc.skills) {
        description += `<p>${skill}</p>`;
      }
      for (const note of npc.notes) {
        description += `<p>${note}</p>`;
      }
      updateData = {
        name: npc.name,
        system: {
          baseAC: npc.AC,
          hp: {
            value: npc.hp,
            max: npc.hp,
          },
          levelBonus: npc.lvl,
          virtue: npc.virtue,
          origVirtue: npc.virtue,
          description: description,
          stats: npc,
        },
      };
    } catch (err) {}
    super._onSubmit(event, {
      updateData: updateData,
      preventClose: false,
      preventRender: false,
    });
  }

  /**
   * This method is called upon form submission after form data is validated
   * @param event {Event}       The initial triggering submission event
   * @param formData {Object}   The object of validated form data with which to update the object
   * @private
   */
  async _updateObject(event: Event, formData: object) {
    event.preventDefault();
    const actor = this.object as HVActor;
    await this.setProfession(actor, formData);
    await this.addSkills(actor, formData);
    await this.addWeapons(actor, formData);
    await actor.update(formData);
    actor?.sheet?.render(true);
  }

  async setProfession(actor: HVActor, formData: object): Promise<void> {
    const groups = formData['system.levelBonus'].match(levelBonusRegEx)?.groups;
    const cls = groups?.class?.trim();
    if (cls) {
      const specialisms = Utils.findLocalizedPack('specialisms');
      const specialism = await HVCharacterCreator.getDocument(cls, specialisms);
      if (specialism && specialism.system.specialism) {
        const professionName = specialism.system.parent.capitalize();
        const hasSpecialism = actor.itemTypes['class'].filter((c) => c.name === specialism.name).length > 0;
        const hasProfession = actor.itemTypes['class'].filter((c) => c.name === professionName).length > 0;
        if (!hasSpecialism) {
          if (!hasProfession) {
            await HVCharacterCreator.setProfession(actor, professionName, false);
          }
          await HVCharacterCreator.setSpecialism(actor, specialism.name, false);
        }
      } else {
        const professions = Utils.findLocalizedPack('classes');
        const profession = await HVCharacterCreator.getDocument(cls, professions);
        if (profession && actor.itemTypes['class'].filter((c) => c.name === profession.name).length == 0) {
          await HVCharacterCreator.setProfession(actor, profession.name, false);
        }
      }
    }
  }

  async addSkills(actor: HVActor, formData: object): Promise<void> {
    const lvlGroups = formData['system.levelBonus'].match(levelBonusRegEx)?.groups;
    const threat = parseInt(lvlGroups?.lvl) ?? 0;
    const skills: Record<string, unknown>[] = [];
    const skillpack = Utils.findLocalizedPack('skills');
    const craftspack = Utils.findLocalizedPack('crafts');
    const sciencepack = Utils.findLocalizedPack('sciences');
    const specialismspack = Utils.findLocalizedPack('specialisms');

    for (const skillText of formData['system.stats.skills']) {
      if (/^[A-Z]/.test(skillText)) {
        const groups = skillText.match(skillRegEx)?.groups;
        const skillName = groups?.skillName?.trim();
        const bonus = parseInt(groups?.bonus) - threat;
        const skill = await HVCharacterCreator.getDocument(
          skillName,
          skillpack,
          craftspack,
          sciencepack,
          specialismspack,
        );
        if (skill) {
          const obj = skill.toObject();
          obj.system.bonus = bonus;
          skills.push(obj);
          formData['system.description'] = formData['system.description'].replace(`<p>${skillText}</p>`, '');
        }
      }
    }
    await actor.createEmbeddedDocuments('Item', skills);
  }

  async addWeapons(actor: HVActor, formData: object): Promise<void> {
    const weapons: Record<string, unknown>[] = [];
    const weaponpacks = Utils.findLocalizedPack('weapons');

    for (const weaponData of formData['system.stats.atk']) {
      const weaponName = weaponData.name.capitalize();
      const description = weaponData.details;
      const weapon = await HVCharacterCreator.getDocument(weaponName, weaponpacks);
      if (weapon) {
        const obj = weapon.toObject();
        obj.system.description += `<p>${description}</p>`;
        weapons.push(obj);
        formData['system.description'] = formData['system.description'].replace(
          `<p>${weaponData.attack_bonus} ${weaponData.name} ${weaponData.dmg} ${weaponData.details ?? ''}</p>`,
          '',
        );
      }
    }
    await actor.createEmbeddedDocuments('Item', weapons);
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.find('button.choice').click((ev) => {
      this.submit(ev);
    });
  }
}

type Weapon = {
  attack_bonus: string;
  dmg: string;
  name: string;
  details?: string;
  source: string;
};

type NPCData = {
  name?: string;
  numAppearing?: string;
  hp?: number;
  lvl?: string;
  AC?: number;
  armour?: string;
  virtue?: string;
  saves: {
    bravery: string;
    deftness: string;
    temptation: string;
  };
  atk: Weapon[];
  skills: string[];
  notes: string[];
};

export class Parser {
  input: string;
  npc: NPCData = {
    saves: {
      bravery: '',
      deftness: '',
      temptation: '',
    },
    notes: [],
    atk: [],
    skills: [],
  };

  constructor(input: string) {
    this.input = input.replace(/-\n/g, '');
    this.input = this.input.replace(/\n/g, ' ');
    this.input = this.input.replace(/(Spells:\s+([0-9+\+\/]*;))/, 'Spells:');
    this.input = this.input.replace(/\.\sHp\s/g, '; Hp ');
    this.input = this.input.replace(/\.[\s]+/g, ';');
    this.parse();
  }

  parse(): void {
    const sections = this.input.split(';');
    const firstsection = (sections.shift() ?? '').split(':');
    const nameAndNumber = firstsection[0].split('(');
    this.npc.name = nameAndNumber[0].trim();
    this.npc.numAppearing = nameAndNumber.length > 1 ? nameAndNumber[1].replace(')', '').trim() : '1';
    this.npc.lvl = firstsection[1].replace('LVL ', '').trim();

    for (let section of sections) {
      section = section.trim();
      switch (section) {
        case section.match(/^AC/)?.input:
          this.parseArmour(section);
          break;
        case section.match(/^V[\s0-9]/)?.input:
          this.parseVirtue(section);
          break;
        case section.match(/[+-]\d\/[+-]\d\/[+-]\d/)?.input:
          this.parseSaves(section);
          break;
        case section.match(/^Atk/)?.input:
          this.parseAttacks(section);
          break;
        case section.match(/^Spec/)?.input:
          this.parseSkills(section);
          break;
        case section.match(/^Hp/)?.input:
          this.parseHp(section);
          break;
        default:
          this.npc.notes.push(section.trim());
          break;
      }
    }
  }

  parseArmour(section: string) {
    const tokens = section.replace('AC ', '').split('(');
    this.npc.AC = parseInt(tokens[0]);
    this.npc.armour = tokens[1]?.replace(')', '') ?? '';
  }

  parseVirtue(section: string) {
    const tokens = section.replace(/V\s?/, '');
    this.npc.virtue = tokens.replace(/\.$/, '').trim();
  }

  parseSaves(section: string) {
    const tokens = section.split('/');
    this.npc.saves.bravery = tokens[0].trim();
    this.npc.saves.deftness = tokens[1].trim();
    this.npc.saves.temptation = tokens[2].trim();
  }

  parseAttacks(section: string) {
    const options = section.replace(/[ ]*Atk /, '').split(' or ');
    for (const option of options) {
      const groups = option.match(weaponRegEx)?.groups;
      if (groups) {
        const weapon: Weapon = {
          name: groups?.weaponName?.trim(),
          attack_bonus: groups?.bonus?.trim(),
          dmg: groups?.dmg?.trim(),
          details: groups?.notes?.trim() ?? '',
          source: option,
        };
        this.npc.atk.push(weapon);
      }
    }
  }

  parseSkills(section: string) {
    const skills = section.replace('Spec ', '').match(new RegExp(skillRegEx, 'g'));
    if (skills) {
      for (const skill of skills) {
        this.npc.skills.push(skill.trim());
      }
    }
  }

  parseHp(section: string) {
    this.npc.hp = parseInt(section.replace('Hp', ''));
  }
}
