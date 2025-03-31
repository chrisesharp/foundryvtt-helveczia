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
import { PeopleItem } from '../items/people/people-item';
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
  private generatedName = '';
  private sex = 'male';
  private people = 'german';
  private helveczian = false;

  static addControl(_object, html): void {
    const control = `<div flexrow>
        <button class='hv-name-gen' type="button" title='${game.i18n.localize(
          'HV.dialog.namegenerator',
        )}'> ${game.i18n.localize('HV.dialog.namegenerator')}
        </button>
        </div>`;
    html.querySelector('.directory-header').innerHTML += control;
    html.querySelector('.hv-name-gen').addEventListener('click', (ev) => {
      ev.preventDefault();
      Hooks.call('HV.Names.genName');
    });
  }

  get title() {
    return game.i18n.localize(this.options.window.title);
  }

  static DEFAULT_OPTIONS = {
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

  static PARTS = {
    helveczia: {
      template: 'systems/helveczia/templates/names/dialog-name.hbs',
    },
    footer: {
      template: 'templates/generic/form-footer.hbs',
    },
  };

  protected async _prepareContext(_options): Promise<EmptyObject> {
    return {
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
    };
  }

  static async showDialog(options = {}): Promise<Dialog | unknown> {
    new HVNameGenerator(options).render(true);
  }

  static randomName(event, _target) {
    this.sex = event.currentTarget?.querySelector('#sex').value;
    this.people = event.currentTarget?.querySelector('#people').value;
    this.helveczian = event.currentTarget?.querySelector('[type=checkbox]').checked;
    this.generatedName = HVNameGenerator.findName(this.sex, this.people, this.helveczian);
    this.render(true);
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

  static shareName(_event, _target) {
    const content = `<h2 class='helveczia generated-name'>${this.generatedName}</h2>`;
    ChatMessage.create({ content: content });
  }
}
