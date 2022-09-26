import { HVActor } from '../../actor/actor';
import { HVPartySheet } from './party-sheet';

export class HVParty {
  private memberCache: HVActor[] = [];
  get members() {
    if (this.memberCache.length === 0) {
      this.memberCache = game.actors?.filter((a) => (a.getFlag('helveczia', 'party') as boolean) === true) ?? [];
    }
    return this.memberCache;
  }
  constructor() {
    HVPartySheet.init(this);
    console.log('Party started...');
  }

  static addControl(_object, html): void {
    const control = `<button class='hv-party-sheet' type="button" title='${game.i18n.localize(
      'HV.dialog.partysheet.name',
    )}'><i class='fas fa-users'></i></button>`;
    html.find('.fas.fa-search').replaceWith($(control));
    html.find('.hv-party-sheet').click((ev) => {
      ev.preventDefault();
      Hooks.call('HV.Party.showSheet');
    });
  }

  update(actor, _data): void {
    const partyFlag = actor.getFlag(game.system.id, 'party');
    if (partyFlag === null) {
      return;
    }
    this.memberCache = game.actors?.filter((a) => (a.getFlag('helveczia', 'party') as boolean) === true) ?? [];
  }
}
