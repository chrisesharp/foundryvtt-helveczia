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

import { Logger } from './logger';
import { Utils } from './utils/utils';
const { renderTemplate } = foundry.applications.handlebars;

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
  static async addChatCriticalButton(msg, html, _data) {
    const chatCard = html.querySelector('.helveczia.chat-card');
    if (!chatCard) return;
    try {
      const uuid = chatCard.dataset.actorId;
      const actor = await Utils.getActorFromUUID(uuid);
      if (actor?.isOwner) {
        await HVChat._addCritButton(msg, actor, chatCard);
      }
    } catch (e) {
      // log.debug('addChatCriticalButton() | error caught: ', e);
    }
  }

  static async _addCritButton(msg, actor, msgContent): Promise<void> {
    const cb = msgContent.querySelector('.critical-roll');
    const msgId = msg.id;
    const dmgResult = cb.dataset.dmgResult;
    const target = cb.dataset.target;
    const multiplier = cb.dataset.multiplier;
    const formula = cb.dataset.formula;
    const button = `<div class="critical-button"><button class="critical" type="button" data-msg-id="${msgId}" data-action="critroll" data-formula="${formula}" data-dmg-result="${dmgResult}" data-multiplier="${multiplier}" data-target="${target}"><i class="fas fa-dice-d20"></i>${game.i18n.localize(
      'HV.RollAgain',
    )}</button></div>`;
    cb.innerHTML += button;
    cb.querySelector('button[data-action="critroll"]').addEventListener('click', (ev) => {
      HVChat._onCritClick(ev, actor, msgContent);
    });
    return;
  }

  static async _onCritClick(ev, actor, msgContent) {
    ev.preventDefault();
    const cb = msgContent.querySelector('.critical-roll').cloneNode(true);
    msgContent.querySelector('.critical-roll').remove();
    const msgId = ev.currentTarget.dataset.msgId;
    const target = ev.currentTarget.dataset.target;
    const formula = ev.currentTarget.dataset.formula;
    const dmgResult = ev.currentTarget.dataset.dmgResult;
    const multiplier = ev.currentTarget.dataset.multiplier;
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
    cb.querySelector('.critical-button')?.remove();
    const roll = await new Roll(formula).evaluate();
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
    cb.innerHTML += html;
    const actualDmgResult = cb.querySelector('#dmg-result');
    cb.querySelector('#dmg-result').remove();
    const hiddenDmg = cb.querySelector('#hidden-damage').cloneNode(true);
    cb.querySelector('#hidden-damage').remove();
    if (rolledResult !== 20) {
      hiddenDmg.querySelector('.dice-total').replaceWith(actualDmgResult);

      cb.appendChild(hiddenDmg);
      cb.querySelector('#hidden-damage').style.display = 'block';
    }
  }
}
