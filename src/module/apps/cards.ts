export class HVCardsControl {
  static addControl(_object, html): void {
    if (game.user?.isGM) {
      const control = `<div flexrow>
      <button class='hv-card-gen' type="button" title='${game.i18n.localize(
        'HV.dialog.cardgenerator',
      )}'> ${game.i18n.localize('HV.dialog.cardgenerator')}
      </button>
      </div>`;
      // html.find('.fas.fa-search').replaceWith($(control));
      html.find('.header-search').before($(control));
      html.find('.hv-card-gen').click((ev) => {
        ev.preventDefault();
        Hooks.call('HV.Cards.genCards');
      });
    }
  }

  static async showDialog(options = {}): Promise<void> {
    const buttons = {
      ok: {
        label: game.i18n.localize('HV.dialog.createDeckForActor'),
        icon: '<i class="fas fa-dice-d20"></i>',
        callback: (html) => {
          const actor = html.find('#actor').val();
          HVCardsHand.createHandsFor(actor);
        },
      },
    };
    const actors = game.actors?.filter((a) => a.hasPlayerOwner);
    const html = await renderTemplate('systems/helveczia/templates/cards/dialog-generate.hbs', { actors: actors });
    new Dialog({
      title: game.i18n.localize('HV.dialog.cardgenerator'),
      content: html,
      buttons: buttons,
      default: 'ok',
      close: () => {},
    }).render(true, { focus: true, ...options });
  }
}

export class HVCardsPile extends CardsConfig {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: 'systems/helveczia/templates/cards/cards-pile.hbs',
    });
  }
}

export class HVCardsHand extends CardsHand {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: 'systems/helveczia/templates/cards/cards-hand.hbs',
    });
  }

  /** @ooverride */
  getData() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = super.getData();

    // enforce data to ensure compatability between 0.7 and 0.8
    data.isGM = game.user?.isGM;

    data.config = CONFIG.HV;

    data.total = data.cards.reduce((acc, card) => acc + card.data.value, 0);
    return data;
  }

  /** @ooverride */
  activateListeners(html) {
    super.activateListeners(html);
  }

  /** @override */
  async _onCardControl(event): Promise<void> {
    const button = event.currentTarget;
    const li = button.closest('.card');
    const card = li ? this.object.cards.get(li.dataset.cardId) : null;
    const cls = getDocumentClass('Card');

    // Save any pending change to the form
    await this._onSubmit(event, { preventClose: true, preventRender: true });

    // Handle the control action
    switch (button.dataset.action) {
      case 'create':
        cls.createDialog({}, { parent: this.object, pack: this.object.pack ?? undefined });
        break;
      case 'edit':
        card?.sheet?.render(true);
        break;
      case 'delete':
        card?.deleteDialog();
        break;
      case 'deal':
        this.object.dealDialog();
        break;
      case 'draw':
        this.drawDialog(this.object);
        break;
      case 'pass':
        this.object.passDialog();
        break;
      case 'play':
        if (card) this.playDialog(this.object, card);
        break;
      case 'reset':
        this.object.resetDialog();
        break;
      case 'shuffle':
        this._sortStandard = false;
        this.object.shuffle();
        break;
      case 'toggleSort':
        this._sortStandard = !this._sortStandard;
        this.render();
        break;
      case 'nextFace':
        await card?.update({ face: card.data?.face === null ? 0 : card.data?.face + 1 });
        return;
      case 'prevFace':
        await card?.update({ face: card.data?.face === 0 ? null : -1 });
        return;
    }
    return;
  }

  static async createHandsFor(name: string): Promise<void> {
    const packName = 'helveczia.cards';
    // const forename = name.split(' ')[0];
    const userId = game.users?.find((u) => u.character?.name === name)?.id;
    const pack = game.packs.get(packName);
    if (pack) {
      const result = (await pack.importAll({ folderName: `${name}` }))[0];
      const deck = game.cards?.get(result.id);
      const folderId = deck?.folder?.id;
      const perms = {};
      if (userId) perms[userId] = CONST.DOCUMENT_PERMISSION_LEVELS.OWNER;
      await Cards.createDocuments([
        {
          name: `Devil's hand for ${name}`,
          type: 'hand',
          _id: randomID(),
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
          name: `${name}'s returned cards`,
          type: 'pile',
          _id: randomID(),
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

      // Construct the dialog HTML
      const html = await renderTemplate('systems/helveczia/templates/cards/dialog-draw.hbs', {});

      // Display the prompt
      return Dialog.prompt({
        title: game.i18n.localize('CARDS.DrawTitle'),
        label: game.i18n.localize('CARDS.Draw'),
        content: html,
        callback: (html) => {
          const form = html.querySelector('form.cards-dialog') as HTMLFormElement;
          if (form) {
            const fd = new FormDataExtended(form, {}).toObject();
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

      // Construct the dialog HTML
      const html = await renderTemplate('systems/helveczia/templates/cards/dialog-play.hbs', { card, cards });

      // Display the prompt
      return Dialog.prompt({
        title: game.i18n.localize('CARD.Play'),
        label: game.i18n.localize('CARD.Play'),
        content: html,
        callback: (html) => {
          const form = html.querySelector('form.cards-dialog') as HTMLFormElement;
          if (form) {
            const fd = new FormDataExtended(form, {}).toObject();
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
