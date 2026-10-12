import { FrenchNames } from './names/french';
import { GermanNames } from './names/german';
import { ItalianNames } from './names/italian';
import { PolishNames } from './names/polish';
import { DutchNames } from './names/dutch';
import { CzechNames } from './names/czech';
import { EnglishNames } from './names/english';
import { SpanishNames } from './names/spanish';
import { SwedishNames } from './names/swedish';
import { HungarianNames } from './names/hungarian';
import { CossackNames } from './names/cossack';
import { GypsyNames } from './names/gypsy';
import { JewishNames } from './names/jewish';
import { PeopleItem } from '../../documents/people-item';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

type NameType = {
  forename: { male: string; female: string };
  surname: { native: string; helveczian: string };
};

const nameMap = {
  french: FrenchNames,
  german: GermanNames,
  italian: ItalianNames,
  polish: PolishNames,
  dutch: DutchNames,
  czech: CzechNames,
  english: EnglishNames,
  spanish: SpanishNames,
  swedish: SwedishNames,
  hungarian: HungarianNames,
  cossack: CossackNames,
  gypsy: GypsyNames,
  jewish: JewishNames,
};

export class HVNameGenerator extends HandlebarsApplicationMixin(ApplicationV2) {
  // Allow static methods to access instance props (Foundry V14 action handler pattern)
  static [key: string]: any;
  private generatedName = '';
  private sex = 'male';
  private people = 'german';
  private helveczian = false;

  static addControl(_object, html): void {
    const control = `
    <button class='hv-name-gen' type="button" data-action="nameGen" title='${game.i18n.localize(
      'HV.dialog.namegenerator',
    )}'>
      <i class="fa-solid fa-people-simple" inert=""></i>
      <span>${game.i18n.localize('HV.dialog.namegenerator')}</span>
    </button>`;
    html.querySelector('.header-actions.action-buttons').innerHTML += control;
    html.querySelector('.hv-name-gen').addEventListener('click', () => {
      Hooks.call('HV.Names.genName');
    });
  }

  get title() {
    return game.i18n.localize(this.options.window.title);
  }

  static readonly DEFAULT_OPTIONS = {
    id: 'name-generator',
    classes: ['helveczia'],
    actions: {
      generate: HVNameGenerator.randomName,
      share: HVNameGenerator.shareName,
    },
    tag: 'form',
    position: {
      width: 550,
      height: 300,
    },
    window: {
      title: 'HV.dialog.findname',
      resizable: false,
      contentClasses: ['standard-form', 'helveczia', 'dialog', 'creator'],
    },
    generatedName: null,
    sex: 'male',
    people: 'german',
    helveczian: false,
  };

  static readonly PARTS = {
    helveczia: {
      template: 'systems/helveczia/templates/names/dialog-name.hbs',
    },
    footer: {
      template: 'templates/generic/form-footer.hbs',
    },
  };

  protected _prepareContext(_options): Promise<Record<string, unknown>> {
    return Promise.resolve({
      sexes: {
        male: 'HV.Male',
        female: 'HV.Female',
      },
      all_peoples: PeopleItem.peoples(),
      generatedName: this.generatedName,
      sex: this.sex,
      people: this.people,
      helveczia: this.helveczian,
      buttons: [
        {
          icon: 'fas fa-dice-d20',
          label: 'HV.dialog.findname',
          action: 'generate',
        },
        {
          icon: 'fas fa-share',
          label: 'HV.dialog.sendname',
          action: 'share',
        },
      ],
    });
  }

  static async showDialog(options = {}): Promise<HVNameGenerator> {
    const dialog = new HVNameGenerator(options);
    await dialog.render(true);
    return dialog;
  }

  static async randomName(this: HVNameGenerator, event = null, _target = null) {
    const root = this.element;
    const sexSelect = root?.querySelector<HTMLSelectElement>('#sex') ?? event?.currentTarget?.querySelector('#sex');
    const peopleSelect =
      root?.querySelector<HTMLSelectElement>('#people') ?? event?.currentTarget?.querySelector('#people');
    const helvCheck =
      root?.querySelector<HTMLInputElement>('#helveczian, [type=checkbox]') ??
      event?.currentTarget?.querySelector('[type=checkbox]');
    this.sex = sexSelect?.value ?? this.sex;
    this.people = peopleSelect?.value ?? this.people;
    this.helveczian = helvCheck?.checked ?? this.helveczian;
    this.generatedName = HVNameGenerator.findName(this.sex, this.people, this.helveczian);
    return await this.render(true);
  }
  static findName(sex: string, people: string, helveczian: boolean): string {
    for (const r in PeopleItem.races) {
      const name = game.i18n.localize(`HV.people.${r}`);
      if (name == people) {
        people = r;
        break;
      }
    }
    const variant = helveczian ? 'helveczian' : 'native';
    const names: NameType[] = nameMap[people] ?? [];
    const forename = (names[Math.floor(Math.random() * names.length)] as NameType).forename[sex] ?? '';
    let surname = '';
    if (people === 'swedish') {
      const father = (names[Math.floor(Math.random() * names.length)] as NameType).forename['male'];
      surname = sex === 'male' ? `${father}son` : `${father}dotter`;
    } else {
      surname = (names[Math.floor(Math.random() * names.length)] as NameType).surname[variant] ?? '';
    }
    return `${forename} ${surname}`;
  }

  static async shareName(this: HVNameGenerator, _event = null, _target = null) {
    const content = `<h2 class='helveczia generated-name'>${this.generatedName}</h2>`;
    return await ChatMessage.create({ content: content });
  }
}
