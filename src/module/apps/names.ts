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
const { DialogV2 } = foundry.applications.api;

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

export class HVNameGenerator {
  static addControl(_object, html): void {
    const control = `<div flexrow>
        <button class='hv-name-gen' type="button" title='${game.i18n.localize(
          'HV.dialog.namegenerator',
        )}'> ${game.i18n.localize('HV.dialog.namegenerator')}
        </button>
        </div>`;
    // html.find('.fas.fa-search').replaceWith($(control));
    html.find('.header-search').before($(control));
    html.find('.hv-name-gen').click((ev) => {
      ev.preventDefault();
      Hooks.call('HV.Names.genName');
    });
  }

  static async showDialog(options = {}): Promise<Dialog | unknown> {
    const buttons = [
      {
        label: 'HV.dialog.findname',
        icon: 'fas fa-dice-d20',
        action: 'ok',
        callback: (html) => {
          const sex = html?.currentTarget?.querySelector('#sex').value;
          const people = html?.currentTarget?.querySelector('#people').value;
          const helveczian = html?.currentTarget?.querySelector('[type=checkbox]').checked;
          const name = HVNameGenerator.findName(sex, people, helveczian);
          const content = `<h2 class='generated-name'>${name}</h2>`;
          DialogV2.wait({
            window: {
              title: 'HV.dialog.sendname',
            },
            buttons: [
              {
                label: 'HV.dialog.sendname',
                action: 'submit',
                icon: 'fas fa-share',
                callback: () => {
                  ChatMessage.create({ content: content });
                },
              },
            ],
            content: content,
          });
        },
      },
    ];
    const html = await renderTemplate('systems/helveczia/templates/names/dialog-name.hbs', {});
    options['width'] = 425;
    return DialogV2.wait({
      window: {
        title: 'HV.dialog.namegenerator',
      },
      content: html,
      buttons: buttons,
      default: 'ok',
      close: () => {},
    });
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
}
