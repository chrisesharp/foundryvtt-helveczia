/**
 * This is your TypeScript entry file for Foundry VTT.
 * Register custom settings, sheets, and constants using the Foundry API.
 * Change this heading to be more descriptive to your system, or remove it.
 * Author: [Chris Sharp]
 * Content License: [copyright Gabor Lux, 2021]
 * Software License: [mpl-2.0](https://github.com/chrisesharp/foundryvtt-helveczia/blob/main/LICENSE)
 */

// Import TypeScript modules
import { registerSettings } from './settings';
import { preloadTemplates } from './preloadTemplates';
import { Logger } from './logger';
import { HVCharacterSheet } from './actor/character-sheet';
import { HVActor } from './actor/actor';

import { HVItem } from './items/item';
import { SkillSheet } from './items/skill/skill-sheet';
import { PossessionSheet } from './items/possesion/possession-sheet';
import { ArmourSheet } from './items/armour/armour-sheet';
import { WeaponSheet } from './items/weapon/weapon-sheet';
import { DeedSheet } from './items/deed/deed-sheet';
import { ClassSheet } from './items/class/class-sheet';
import { PeopleSheet } from './items/people/people-sheet';
import { SpellSheet } from './items/spell/spell-sheet';

import { HV } from './config';
import { registerHandlebarHelpers } from './handlebar-helpers';
import { HVActorSheet } from './actor/actor-sheet';
import { HVChat } from './chat';
import { HVNPCSheet } from './actor/npc-sheet';
import { BookSheet } from './items/book/book-sheet';
import { HVCombat, HVCombatant } from './combat';
import { HVCardsHand, HVCardsPile, HVCardsControl } from './apps/cards';
import { HVNameGenerator } from './apps/names';
import { HVParty } from './apps/party/party';
import { HVPartySheet } from './apps/party/party-sheet';

const log = new Logger();

// Initialize system
Hooks.once('init', async () => {
  log.info('Initializing Helvéczia');

  // Enable hook debug
  CONFIG.debug.hooks = false;

  // Assign custom classes and constants here
  CONFIG.HV = HV;
  CONFIG.Actor.documentClass = HVActor;
  CONFIG.Item.documentClass = HVItem;
  CONFIG.Combatant.documentClass = HVCombatant;

  // Register custom system settings
  registerSettings();

  // Register custom handlebar helpers
  registerHandlebarHelpers();

  CONFIG.HV.showEffects = game.settings.get('helveczia', 'effects') as boolean;
  CONFIG.Combat.initiative = {
    formula: '1d20+@initiative',
    decimals: 2,
  };

  // Preload Handlebars templates
  await preloadTemplates();

  // Register custom sheets (if any)
  // Register sheet application classes

  DocumentSheetConfig.unregisterSheet(Cards, 'core', CardsHand);
  DocumentSheetConfig.registerSheet(Cards, 'core', HVCardsHand, {
    label: 'CARDS.CardsHand',
    types: ['hand'],
    makeDefault: true,
  });
  DocumentSheetConfig.unregisterSheet(Cards, 'core', CardsPile);
  DocumentSheetConfig.registerSheet(Cards, 'core', HVCardsPile, {
    label: 'CARDS.CardsPile',
    types: ['pile'],
    makeDefault: true,
  });

  Actors.unregisterSheet('core', ActorSheet);
  Items.unregisterSheet('core', ItemSheet);
  Actors.registerSheet('helveczia', HVCharacterSheet, { types: ['character'], makeDefault: true });
  Actors.registerSheet('helveczia', HVNPCSheet, { types: ['npc'], makeDefault: true });
  Actors.registerSheet('helveczia', HVPartySheet, { types: ['party'], makeDefault: true });
  Items.registerSheet('helveczia', SkillSheet, { types: ['skill'] });
  Items.registerSheet('helveczia', PossessionSheet, { types: ['possession'] });
  Items.registerSheet('helveczia', ArmourSheet, { types: ['armour'] });
  Items.registerSheet('helveczia', WeaponSheet, { types: ['weapon'] });
  Items.registerSheet('helveczia', ClassSheet, { types: ['class'] });
  Items.registerSheet('helveczia', DeedSheet, { types: ['deed'] });
  Items.registerSheet('helveczia', PeopleSheet, { types: ['people'] });
  Items.registerSheet('helveczia', SpellSheet, { types: ['spell'] });
  Items.registerSheet('helveczia', BookSheet, { types: ['book'] });
});

// Setup system
Hooks.once('setup', async () => {
  // Do anything after initialization but before
  // ready
  new HVParty();
});

// When ready
Hooks.once('ready', async () => {
  // Do anything once the system is ready
  if (game.user?.isGM) {
    const hungarians = game.actors?.filter((i) => i.isHungarian());
    if (hungarians?.length) {
      Promise.all(hungarians?.map(async (actor) => await actor.setFlag('helveczia', 'fate-invoked', false)));
      log.info('Fate of Hungarians reset');
    }
  }

  CONFIG.HV.createCardsFor = HVCardsHand.createHandsFor;
});

// Add any additional hooks if necessary
Hooks.on('HV.Cards.genCards', HVCardsControl.showDialog);
Hooks.on('HV.Names.genName', HVNameGenerator.showDialog);
Hooks.on('HV.Party.showSheet', HVPartySheet.showSheet);

Hooks.on('applyActiveEffect', async (actor, changeData) => {
  actor.applyCustomEffect(changeData);
});

Hooks.on('dropActorSheetData', (actor: HVActor, sheet: HVActorSheet, data) => {
  return sheet.onDropAllow(actor, data);
});

Hooks.on('dropItemSheetData', (actor: HVActor, sheet: HVActorSheet, data) => {
  return sheet.onDropAllow(actor, data);
});

Hooks.on('renderChatMessage', HVChat.addChatCriticalButton);
Hooks.on('renderCombatTracker', HVCombat.format);

// License and KOFI infos
Hooks.on('renderSidebarTab', async (object, html) => {
  if (object instanceof ActorDirectory) {
    HVParty.addControl(object, html);
    HVNameGenerator.addControl(object, html);
  }

  if (object instanceof CardsDirectory) {
    HVCardsControl.addControl(object, html);
  }

  if (object instanceof Settings) {
    const gamesystem = html.find('#game-details');
    // License text
    const template = 'systems/helveczia/templates/chat/license.html';
    const rendered = await renderTemplate(template, {});
    gamesystem.find('.system').append(rendered);

    // User guide
    const docs = html.find("button[data-action='docs']");
    const site = 'https://chrisesharp.github.io/foundryvtt-helveczia';
    const styling = 'border:none;margin-right:2px;vertical-align:middle;margin-bottom:5px';
    $(
      `<button data-action="userguide"><img src='/systems/dee/assets/default/icons/magic.png' width='16' height='16' style='${styling}'/>Helvéczia Guide</button>`,
    ).insertAfter(docs);
    html.find('button[data-action="userguide"]').click(() => {
      const fv = new FrameViewer();
      fv.url = site;
      fv.render(true);
    });
  }
});
