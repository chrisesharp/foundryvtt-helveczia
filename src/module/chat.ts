/**
 * This function is used to hook into the Chat Log context menu to add additional options to each message
 * These options make it easy to conveniently apply damage to controlled tokens based on the value of a Roll
 *
 * @param {HTMLElement} html    The Chat Message being rendered
 * @param {Array} options       The Array of Context Menu options
 *
 * @return {Array}              The extended options Array including new context choices
 */
/* -------------------------------------------- */

import { HVActor } from './actor/actor';
import { Logger } from './logger';

const log = new Logger();

const templatePath = 'systems/helveczia/templates/chat/';

export function updateChatMessage(actor, msgId, crit) {
  log.debug('_updateChatMessage() | calling socket as GM for message ', msgId, crit);
  ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    content: $(crit).html(),
  });
}

export class HVChat {
  static async getActorFromUUID(uuid): Promise<HVActor> {
    const obj = await fromUuid(uuid);

    if (obj instanceof TokenDocument) {
      return obj.actor as HVActor;
    }
    return obj as HVActor;
  }

  static async addChatCriticalButton(msg, html, _data) {
    const chatCard = html.find('.helveczia.chat-card');
    try {
      const actor = await HVChat.getActorFromUUID(chatCard.attr('data-actor-id'));
      if (actor && actor.isOwner) {
        await HVChat._addCritButton(msg, actor, chatCard);
      }
    } catch (e) {
      log.debug('addChatCriticalButton() | error caught: ', e);
    }
  }

  static async _addCritButton(msg, actor, msgContent): Promise<void> {
    const cb = $(msgContent).find('.critical-roll');
    const msgId = msg.id;
    const dmgResult = cb.data('dmgResult');
    const target = cb.data('target');
    const multiplier = cb.data('multiplier');
    const formula = cb.data('formula');
    cb.find('#hidden-damage').hide();
    const button = `<div class="critical-button"><button class="critical" type="button" data-msg-id="${msgId}" data-action="critroll" data-formula="${formula}" data-dmg-result="${dmgResult}" data-multiplier="${multiplier}" data-target="${target}"><i class="fas fa-dice-d20"></i>${game.i18n.localize(
      'HV.RollAgain',
    )}</button></div>`;
    cb.append($(button));
    cb.find('button[data-action="critroll"]').on('click', (ev) => {
      HVChat._onCritClick(ev, actor, msgContent);
    });
    return;
  }

  static async _onCritClick(ev, actor, msgContent) {
    ev.preventDefault();
    const cb = $(msgContent).find('.critical-roll').clone();
    const msgId = ev.currentTarget.dataset.msgId;
    const target = ev.currentTarget.dataset.target;
    const formula = ev.currentTarget.dataset.formula;
    const dmgResult = ev.currentTarget.dataset.dmgResult;
    const multiplier = ev.currentTarget.dataset.multiplier;
    $(ev.currentTarget).remove();
    await HVChat._applyChatCritRoll({
      actor: actor,
      cb: cb,
      target: target,
      formula: formula,
      dmgResult: dmgResult,
      multiplier: multiplier,
    });
    updateChatMessage(actor, msgId, cb);
  }

  static async _applyChatCritRoll({ actor, cb, target, formula, dmgResult, multiplier }): Promise<void> {
    $(cb).find('.critical-button').remove();
    const roll = await new Roll(formula).evaluate({ async: true });
    const rolledDie = roll.terms[0] as Die;
    const rolledResult = rolledDie.results[0]?.result;
    let result: string;
    if (rolledResult === 20) {
      result = `<div class="roll-result roll-success"><b>${game.i18n.format('HV.InstantDeath')}</b></div>`;
    } else if (roll.total >= target) {
      const total = dmgResult * multiplier;
      result = `<div class="roll-result roll-success"><b>${game.i18n.localize(
        'HV.SecondCritical',
      )}<b></div><h4 class="dice-total" id="dmg-result">${dmgResult} x ${multiplier} = ${total}</h4>`;
    } else {
      result = `<h4 class="dice-total" id="dmg-result">${dmgResult}</h4>`;
    }

    const speaker = ChatMessage.getSpeaker({ actor: actor });
    const templateData = {
      title: game.i18n.format('HV.RollingCritical', { actor: speaker.alias }),
      speaker: speaker,
      result: result,
      rollHV: await roll.render(),
    };
    const html = await renderTemplate(`${templatePath}/roll-crit.hbs`, templateData);
    cb.append($(html));
    const actualDmgResult = cb.find('#dmg-result').remove();
    const hiddenDmg = cb.find('#hidden-damage').remove();
    if (rolledResult !== 20) {
      $(hiddenDmg).find('.dice-total').replaceWith($(actualDmgResult));
      cb.append($(hiddenDmg));
      cb.find('#hidden-damage').show();
    }
  }
}
