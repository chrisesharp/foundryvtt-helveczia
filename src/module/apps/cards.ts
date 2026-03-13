import { Utils } from '../utils/utils';
const { DialogV2 } = foundry.applications.api;
const { CardDeckConfig, CardHandConfig } = foundry.applications.sheets;
const { renderTemplate } = foundry.applications.handlebars;

export class HVCardsControl {
  static addControl(_object, html): void {
    if (game.user?.isGM) {
      const control = `<div flexrow>
      <button class='hv-card-gen' type="button" title='${game.i18n.localize(
        'HV.dialog.cardgenerator',
      )}'> ${game.i18n.localize('HV.dialog.cardgenerator')}
      </button>
      </div>`;
      html.querySelector('.directory-header').innerHTML += control;
      html.querySelector('.hv-card-gen').addEventListener('click', (ev) => {
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
      classes: ['helveczia'],
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
  static DEFAULT_OPTIONS = {
    classes: ['helveczia'],
    window: {
      contentClasses: ['helveczia', 'dialog', 'creator'],
    },
  };
  static PARTS = {
    cards: {
      root: true,
      template: 'systems/helveczia/templates/cards/cards-pile.hbs',
    },
  };
}

export class HVCardsHand extends CardHandConfig {
  static DEFAULT_OPTIONS = {
    actions: {
      draw: HVCardsHand.drawDialog,
      pass: HVCardsHand.playDialog,
    },
    classes: ['helveczia'],
    window: {
      contentClasses: ['helveczia', 'dialog', 'creator'],
    },
  };

  static PARTS = {
    cards: {
      root: true,
      template: 'systems/helveczia/templates/cards/cards-hand.hbs',
    },
  };

  static async createHandsFor(name: string): Promise<void> {
    const userId = game.users?.find((u) => u.character?.name === name)?.id;
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

  static async drawDialog(_event, _target) {
    const user = game.user;
    if (user != null) {
      const source = this.document;
      const sourceDeck = source.getFlag('helveczia', 'sourceDeck');
      const decks = [sourceDeck];
      if (!decks?.length) return ui.notifications.warn('CARDS.DrawWarnNoSources', { localize: true });

      const html = await renderTemplate('systems/helveczia/templates/cards/dialog-draw.hbs', {});

      const buttons = [
        {
          label: game.i18n.localize('CARDS.ACTIONS.Draw'),
          icon: 'fas fa-cards',
          action: 'draw',
          callback: (event, button, _dialog) => button.form.elements.number.value,
        },
      ];

      return DialogV2.wait({
        classes: ['helveczia'],
        window: {
          title: game.i18n.localize('CARDS.DrawTitle'),
        },
        content: html,
        buttons: buttons,
        submit: (result) => {
          const from = game.cards?.get(sourceDeck);
          const options = { how: CONST.CARD_DRAW_MODES.RANDOM, updateData: { face: null } };
          return source.draw(from, parseInt(result), options).catch((err) => {
            ui.notifications.error(err.message);
            return [];
          });
        },
        rejectClose: false,
        close: () => {},
      });
    }
  }

  static async playDialog(_event, target) {
    const user = game.user;
    const source = this.document;
    if (user != null) {
      const cards = game.cards?.filter(
        (c) => c !== source && c.type === 'pile' && c.testUserPermission(user, 'LIMITED'),
      );
      if (!cards?.length) return ui.notifications.warn('CARDS.PassWarnNoTargets', { localize: true });
      const card = source.cards.filter((c) => c.id === target.dataset.cardId)[0];
      const choices = cards
        .filter((c) => c.name.includes(card.parent.flags.helveczia.playTarget))
        .map((c) => ({ name: c.name, id: c.id }));
      const html = await renderTemplate('systems/helveczia/templates/cards/dialog-play.hbs', { card, choices });

      const buttons = [
        {
          label: game.i18n.localize('CARD.Play'),
          icon: 'fas fa-cards',
          action: 'play',
          callback: (event, button, _dialog) => button.form.elements,
        },
      ];

      return DialogV2.wait({
        classes: ['helveczia'],
        window: {
          title: game.i18n.localize('CARD.Play'),
        },
        content: html,
        buttons: buttons,
        submit: (result) => {
          const to = game.cards?.get(result.to.value as string);
          const options = { action: 'play', updateData: result.down.checked ? { face: null } : {} };
          return source.pass(to, [card.id], options).catch((err) => {
            return ui.notifications.error(err.message);
          });
        },
        rejectClose: false,
        close: () => {},
      });
    }
  }
}
