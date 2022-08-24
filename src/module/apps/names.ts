import { FrenchNames } from './names/french';
import { GermanNames } from './names/german';
import { ItalianNames } from './names/italian';

type NameType = {
  forename: { male: string; female: string };
  surname: { native: string; helveczian: string };
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

  static async showDialog(options = {}): Promise<void> {
    const buttons = {
      ok: {
        label: game.i18n.localize('HV.dialog.findname'),
        icon: '<i class="fas fa-dice-d20"></i>',
        callback: (html) => {
          const sex = html.find('#sex').val();
          const people = html.find('#people').val();
          const helveczian = html.find('[type=checkbox]').is(':checked');
          ui.notifications.info(HVNameGenerator.findName(sex, people, helveczian));
        },
      },
    };
    const html = await renderTemplate('systems/helveczia/templates/names/dialog-name.hbs', {});
    new Dialog({
      title: game.i18n.localize('HV.dialog.namegenerator'),
      content: html,
      buttons: buttons,
      default: 'ok',
      close: () => {},
    }).render(true, { focus: true, ...options });
  }

  static findName(sex: string, people: string, helveczian: boolean): string {
    const variant = helveczian ? 'helveczian' : 'native';
    let names: NameType[] = [];
    switch (people) {
      case 'french':
        names = FrenchNames;
        break;
      case 'italian':
        names = ItalianNames;
        break;
      case 'german':
        names = GermanNames;
        break;
    }
    const name = names[Math.floor(Math.random() * names.length)] as NameType;
    return name ? `${name.forename[sex]} ${name.surname[variant]}` : '';
  }
}
