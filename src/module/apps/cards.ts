import { Utils } from '../utils/utils';
const { DialogV2 } = foundry.applications.api;
const { CardDeckConfig, CardHandConfig } = foundry.applications.sheets;

export class HVCardsControl {
  static addControl(_object, html): void {
    if (game.user?.isGM) {
      const control = `<div flexrow>
      <button class='hv-card-gen' type="button" title='${game.i18n.localize(
        'HV.dialog.cardgenerator',
      )}'> ${game.i18n.localize('HV.dialog.cardgenerator')}
      </button>
      </div>`;
      html.find('.header-search').before($(control));
      html.find('.hv-card-gen').click((ev) => {
        ev.preventDefault();
        Hooks.call('HV.Cards.genCards');
      });
    }
  }

  static async showDialog(_options = {}): Promise<void> {
    const buttons = [
      {
        label: 'HV.dialog.createDeckForActor',
        icon: 'fas fa-dice-d20',
        action: 'ok',
        callback: (html) => {
          const actor = html?.currentTarget?.querySelector('#actor').value;
          HVCardsHand.createHandsFor(actor);
        },
      },
    ];
    const actors = game.actors?.filter((a) => a.hasPlayerOwner);
    const html = await renderTemplate('systems/helveczia/templates/cards/dialog-generate.hbs', { actors: actors });
    DialogV2.wait({
      window: {
        title: 'HV.dialog.cardgenerator',
      },
      content: html,
      buttons: buttons,
      default: 'ok',
      close: () => {},
    });
  }
}

export class HVCardsPile extends CardDeckConfig {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: 'systems/helveczia/templates/cards/cards-pile.hbs',
    });
  }
}

export class HVCardsHand extends CardHandConfig {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: 'systems/helveczia/templates/cards/cards-hand.hbs',
    });
  }

  /** @ooverride */
  getData(options) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = super.getData(options);
    data.isGM = game.user?.isGM;
    data.config = CONFIG.HV;
    data.total = data.cards.reduce((acc, card) => acc + card.value, 0);
    return data;
  }

  /** @ooverride */
  activateListeners(html) {
    super.activateListeners(html);
  }

  // /** @override */
  async _onCardControl(event) {
    const button = event.currentTarget;
    const li = button.closest('.card');
    const card = li ? this.object.cards.get(li.dataset.cardId) : null;
    const cls = getDocumentClass('Card');

    // Save any pending change to the form
    await this._onSubmit(event, { preventClose: true, preventRender: true });

    // Handle the control action
    switch (button.dataset.action) {
      case 'create':
        return cls.createDialog({}, { parent: this.object, pack: this.object.pack });
      case 'edit':
        return card.sheet.render(true);
      case 'delete':
        return card.deleteDialog();
      case 'deal':
        return this.object.dealDialog();
      case 'draw':
        return this.drawDialog(this.object);
      case 'pass':
        return this.object.passDialog();
      case 'play':
        return this.playDialog(this.object, card);
      case 'reset':
        return this.object.resetDialog();
      case 'shuffle':
        this.options.sort = this.constructor.SORT_TYPES.SHUFFLED;
        return this.object.shuffle();
      case 'toggleSort':
        this.options.sort = { standard: 'shuffled', shuffled: 'standard' }[this.options.sort];
        return this.render();
      case 'nextFace':
        return card.update({ face: card.face === null ? 0 : card.face + 1 });
      case 'prevFace':
        return card.update({ face: card.face === 0 ? null : card.face - 1 });
    }
  }

  static async createHandsFor(name: string): Promise<void> {
    // const packName = 'helveczia.cards';
    const userId = game.users?.find((u) => u.character?.name === name)?.id;
    // const pack = game.packs.get(packName);
    const pack = Utils.findLocalizedPack('cards');
    if (pack) {
      const result = (await pack.importAll({ folderName: `${name}` }))[0];
      const deck = game.cards?.get(result.id);
      const folderId = deck?.folder?.id;
      const perms = {};
      if (userId) perms[userId] = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
      await Cards.createDocuments([
        {
          name: game.i18n.format('HV.cards.devilsHand', { character: name }),
          type: 'hand',
          _id: foundry.utils.randomID(),
          folder: folderId,
          permission: perms,
          flags: {
            helveczia: {
              playTarget: name,
              sourceDeck: deck?.id,
            },
          },
        },
        {
          name: game.i18n.format('HV.cards.returned', { character: name }),
          type: 'pile',
          _id: foundry.utils.randomID(),
          folder: folderId,
        },
      ]);
    }
  }

  async drawDialog(source) {
    const user = game.user;
    if (user != null) {
      const sourceDeck = source.getFlag('helveczia', 'sourceDeck');
      const decks = [sourceDeck];
      if (!decks?.length) return ui.notifications.warn('CARDS.DrawWarnNoSources', { localize: true });

      const html = await renderTemplate('systems/helveczia/templates/cards/dialog-draw.hbs', {});

      return Dialog.prompt({
        title: game.i18n.localize('CARDS.DrawTitle'),
        label: game.i18n.localize('CARDS.Draw'),
        content: html,
        callback: (html) => {
          const form = html.querySelector('form.cards-dialog') as HTMLFormElement;
          if (form) {
            const fd = new FormDataExtended(form, {}).object;
            const from = game.cards?.get(sourceDeck);
            const options = { how: CONST.CARD_DRAW_MODES.RANDOM, updateData: { face: null } };
            return source.draw(from, fd.number, options).catch((err) => {
              ui.notifications.error(err.message);
              return [];
            });
          }
        },
        rejectClose: false,
        options: { jQuery: false },
      });
    }
  }

  async playDialog(source, card) {
    const user = game.user;
    if (user != null) {
      const cards = game.cards?.filter(
        (c) => c !== source && c.type !== 'deck' && c.testUserPermission(user, 'LIMITED'),
      );
      if (!cards?.length) return ui.notifications.warn('CARDS.PassWarnNoTargets', { localize: true });

      const html = await renderTemplate('systems/helveczia/templates/cards/dialog-play.hbs', { card, cards });

      return Dialog.prompt({
        title: game.i18n.localize('CARD.Play'),
        label: game.i18n.localize('CARD.Play'),
        content: html,
        callback: (html) => {
          const form = html.querySelector('form.cards-dialog') as HTMLFormElement;
          if (form) {
            const fd = new FormDataExtended(form, {}).object;
            const to = game.cards?.get(fd.to as string);
            const options = { action: 'play', updateData: fd.down ? { face: null } : {} };
            return source.pass(to, [card.id], options).catch((err) => {
              return ui.notifications.error(err.message);
            });
          }
        },
        rejectClose: false,
        options: { jQuery: false },
      });
    }
  }
}
