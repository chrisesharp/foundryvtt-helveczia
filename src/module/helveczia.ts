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
import { HVPartySheet } from './actor/party-sheet';
import { Utils } from './utils/utils';
import { init as quench_tests_init } from '../tests/quench';
import { registerKeyBindings } from './keys';
import { HVToken } from './token';
import { HVSceneConfig } from './scene';

const { DocumentSheetConfig } = foundry.applications.apps;
const { CardHandConfig, CardPileConfig, SceneConfig } = foundry.applications.sheets;
const { ActorDirectory, CardsDirectory, Settings } = foundry.applications.sidebar.tabs;
const { FrameViewer } = foundry.applications.sidebar.apps;
const { ActorSheet, ItemSheet } = foundry.appv1.sheets;
const { Actors, Items } = foundry.documents.collections;
const { renderTemplate } = foundry.applications.handlebars;

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
  CONFIG.Token.objectClass = HVToken;
  CONFIG.Combatant.documentClass = HVCombatant;
  CONFIG.Combat.documentClass = HVCombat;

  CONFIG.ActiveEffect.legacyTransferral = false;

  // Register custom system settings
  registerSettings();
  CONFIG.HV.showEffects = game.settings.get('helveczia', 'effects') as boolean;
  CONFIG.HV.flipTokens = game.settings.get('helveczia', 'token-flip') as boolean;
  CONFIG.HV.depthTokens = game.settings.get('helveczia', 'token-depth') as boolean;

  // Register custom handlebar helpers
  registerHandlebarHelpers();

  // Register special keys
  registerKeyBindings();

  CONFIG.Combat.initiative = {
    formula: '1d20+@initiative',
    decimals: 2,
  };

  // Preload Handlebars templates
  await preloadTemplates();

  // Register custom sheets (if any)
  // Register sheet application classes

  DocumentSheetConfig.unregisterSheet(Cards, 'core', CardHandConfig);
  DocumentSheetConfig.registerSheet(Cards, 'core', HVCardsHand, {
    label: 'CARDS.CardsHand',
    types: ['hand'],
    makeDefault: true,
  });
  DocumentSheetConfig.unregisterSheet(Cards, 'core', CardPileConfig);
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

  DocumentSheetConfig.unregisterSheet(Scene, 'core', SceneConfig);
  DocumentSheetConfig.registerSheet(Scene, 'core', HVSceneConfig);

  quench_tests_init(); // Will have no effect unless Quench is active
});

// Setup system
Hooks.once('setup', async () => {
  // Do anything after initialization but before
  // ready
  log.info('Setting core.uiConfig.colorScheme.applications to "light" so it works better for our color scheme');
  game.settings?.set('core', 'uiConfig', { colorScheme: { applications: 'light', interface: 'dark' } });
});

// When ready
Hooks.once('ready', async () => {
  // Do anything once the system is ready
  if (game.user?.isGM) {
    Utils.migrate();

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

Hooks.on('preUpdateToken', async (tokenDocument, change, options, _userid) => {
  if (!CONFIG.HV.flipTokens) return;
  if (change.rotation === 90 || change.rotation === 270) {
    change.texture = { scaleX: 0 - tokenDocument.texture.scaleX };
    options.animation = { duration: 100 };
  }
});

Hooks.on('refreshToken', async (token, _options) => {
  if (CONFIG.HV.depthTokens) token.tooltip.text = '';
});

Hooks.on('applyActiveEffect', async (actor, changeData) => {
  if (!Utils.canModifyActor(game.user, actor)) {
    return;
  }
  actor.applyCustomEffect(changeData);
});

Hooks.on('dropActorSheetData', (actor: HVActor, sheet: HVActorSheet, data) => {
  return sheet.onDropAllow(actor, data);
});

Hooks.on('dropItemSheetData', (actor: HVActor, sheet: HVActorSheet, data) => {
  return sheet.onDropAllow(actor, data);
});

Hooks.on('renderChatMessageHTML', HVChat.addChatCriticalButton);
Hooks.on('renderCombatTracker', HVCombat.format);

Hooks.on('preCreateCombatant', (combatant, _data, _options, _userId) => {
  if (combatant.actor.type === 'party') {
    const members = game.actors?.filter((a) => a.getFlag('helveczia', 'party') === combatant.actor.uuid);
    const tokenId = combatant.tokenId;
    if (combatant.combat.getFlag('helveczia', 'party-token') === tokenId) {
      Hooks.call('removePartyFromCombat', members, combatant);
    } else {
      Hooks.call('addPartyToCombat', members, combatant);
    }
    return false;
  }
  return;
});

Hooks.on('addPartyToCombat', async (members, combatant) => {
  const combat = combatant.combat;
  await combat.setFlag('helveczia', 'party-token', combatant.tokenId);
  if (members) {
    const combatants: Combatant[] = [];
    await Promise.all(
      members.map(async (a) => {
        const combatant = await Combatant.create({ actorId: a.id, combat: combat }, { parent: combat });
        if (combatant) combatants.push(combatant);
      }),
    );
  }
});

Hooks.on('removePartyFromCombat', async (members: Actor[], combatant: Combatant) => {
  const combat = combatant.combat;
  await combat?.unsetFlag('helveczia', 'party-token');
  const actorIds = members.filter((a) => a.id != null).map((a) => a.id);
  if (members && combat) {
    const combatantIds = combat.combatants
      .filter((a) => {
        const id = a.actorId;
        return (id != null && actorIds.includes(id)) as boolean;
      })
      .map((c) => c.id ?? '');
    await combat?.deleteEmbeddedDocuments('Combatant', combatantIds);
  }
});

// License and KOFI infos
Hooks.on('renderActorDirectory', async (object, html) => {
  HVNameGenerator.addControl(object, html);
});

Hooks.on('renderCardsDirectory', async (object, html) => {
  HVCardsControl.addControl(object, html);
});

Hooks.on('getApplicationHeaderButtons', async (object, html) => {
  console.log(object, html);
});

Hooks.on('renderSettings', async (object, html) => {
  const gamesystem = html.querySelector('.info');
  // License text
  const template = 'systems/helveczia/templates/chat/license.html';
  const rendered = await renderTemplate(template, {});
  gamesystem.querySelector('.system').innerHTML += rendered;

  // User guide
  const docs = html.querySelector("button[data-app='support']");
  const site = 'https://chrisesharp.github.io/foundryvtt-helveczia';
  const styling = 'border:none;margin-right:2px;vertical-align:middle;margin-bottom:5px';
  const button = `<button data-action="userguide"><img src='systems/helveczia/assets/icons/shilling.png' width='16' height='16' style='${styling}'/>Helvéczia Guide</button>`;
  docs.parentNode.innerHTML += button;
  html.querySelector('button[data-action="userguide"]').addEventListener('click', () => {
    const fv = new FrameViewer({ url: site });
    fv.url = site;
    fv.render(true);
  });
});
